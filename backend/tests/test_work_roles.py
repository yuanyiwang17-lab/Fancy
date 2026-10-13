"""Offline checks for the simplified workflow; no provider calls or database writes."""
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from app.core.orchestrator import _analyze, _dispatch_experts
from app.core.models import Evidence
from app.data import load_experts


class WorkRoleTests(unittest.TestCase):
    def test_dispatch_does_not_call_a_model_and_all_members_exist(self):
        with patch('app.core.orchestrator.chat_json', side_effect=AssertionError('Unexpected model call')) as model:
            dispatch = _dispatch_experts('Compare products', ['A', 'B'], ['pricing'])
        model.assert_not_called()
        roster = {e['id'] for e in load_experts()}
        members = [m['id'] for m in dispatch['members']]
        self.assertEqual(set(members), roster)
        self.assertEqual(len(members), len(set(members)))
        self.assertIn(dispatch['lead'], members)

    def test_static_frontend_and_backend_share_the_same_roster(self):
        project = Path(__file__).resolve().parents[2]
        frontend = json.loads((project / 'frontend/public/assets/experts.json').read_text(encoding='utf-8'))
        self.assertEqual(frontend, load_experts())

    def test_analysis_cannot_assign_claims_to_a_collector_or_retired_role(self):
        evidence = [Evidence('e_1', 'https://example.com/source', 'official',
                             'Product A', 'A has feature X.', '2026-10-13', 80, 'L1-025')]
        response = {'claims': [
            {'text': 'A has feature X.', 'author': author, 'evidence_ids': ['e_1', 'missing']}
            for author in ['L1-025', 'L2-002', 'L2-001']
        ]}
        with patch('app.core.orchestrator.chat_json', return_value=response):
            analysis = _analyze('Compare A', ['A'], ['features'], evidence,
                                [e['id'] for e in load_experts()])
        self.assertEqual(len(analysis['claims']), 3)
        for claim in analysis['claims']:
            self.assertEqual(claim['author'], 'L2-001')
            self.assertEqual(claim['evidence_ids'], ['e_1'])
            self.assertNotEqual(claim['confidence'], 'high')


if __name__ == '__main__':
    unittest.main()
