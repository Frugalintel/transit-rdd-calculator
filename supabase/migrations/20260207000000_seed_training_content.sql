-- ============================================================================
-- Seed: Date Change Process Training Content
-- Converts the full date change flowchart into interactive training scenarios
-- ============================================================================

-- Temporarily disable FK so steps can reference rows inserted later in file
ALTER TABLE public.training_steps DROP CONSTRAINT IF EXISTS training_steps_next_step_fkey;

-- Module: Date Change Process
INSERT INTO public.training_modules (id, title, description, icon, display_order, is_published)
VALUES (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Date Change Process',
    'Complete guide to handling date change requests for military/government shipments. Covers both member-requested and agent-requested changes with all decision points, spread checks, and update procedures.',
    'book',
    0,
    true
);

-- Scenario 1: Member-Requested Date Change
INSERT INTO public.training_scenarios (id, module_id, title, description, icon, complexity_level, tags, display_order, is_published)
VALUES (
    'b1b2c3d4-0001-4000-8000-000000000001',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Member-Requested Date Change',
    'Walk through the complete process when a SERVICE MEMBER requests a date change. Covers accommodation checks, self-haul scenarios, spread verification, and update checklists.',
    'compass',
    'intermediate',
    ARRAY['date-change', 'member', 'spread', 'checklist'],
    0,
    true
);

-- Scenario 2: Agent-Requested Date Change
INSERT INTO public.training_scenarios (id, module_id, title, description, icon, complexity_level, tags, display_order, is_published)
VALUES (
    'b1b2c3d4-0002-4000-8000-000000000001',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Agent-Requested Date Change',
    'Walk through the complete process when a DELIVERY AGENT or HAULER AGENT requests a date change. Covers DA vs HA paths, packing impact, hauler assignment, member confirmation, and update checklists.',
    'sign',
    'complex',
    ARRAY['date-change', 'agent', 'da', 'ha', 'hauler'],
    1,
    true
);


-- ============================================================================
-- MEMBER-REQUESTED DATE CHANGE STEPS (~28 steps)
-- ============================================================================

-- M1: Start - Overview
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_overview',
    'Member-Requested Date Change',
    'A service member has requested a date change for their shipment. This scenario walks you through every decision point in the process.

Before starting, have the shipment details ready: current dates, weight, distance, and any existing survey/premove information.

Reference the full flowchart image at any time for the big picture.',
    'info',
    'book',
    'm_can_accommodate',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    0
);

-- M2: Can both O/A/HA accommodate?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_can_accommodate',
    'Can Both O/A/HA Accommodate?',
    'Contact the Origin Agent (OA) and Hauler Agent (HA) to determine if they can accommodate the member''s requested new dates.

Check with BOTH agents — if either cannot accommodate, the process changes.

TIP: Always document who you contacted and when in your notes.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "YES — Both can accommodate", "nextStep": "m_can_keep_dates"},
        {"label": "NO — One or both cannot", "nextStep": "m_no_change"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    1
);

-- M3: No Change (end)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_no_change',
    'No Change — Request Denied',
    'If the agents cannot accommodate the requested dates, the date change cannot proceed.

Inform the member that the requested dates are not available and the shipment will continue with the original schedule.

Document the denial and the reason in your notes.',
    'info',
    'chain',
    NULL,
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    2
);

-- M4: Can member keep dates?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_can_keep_dates',
    'Can Member Keep Dates?',
    'Confirm with the member whether they can keep the currently scheduled dates, or if a change is still needed.

Sometimes after learning what''s available, the member may decide to keep the original dates.',
    'decision',
    'clock',
    NULL,
    '[
        {"label": "YES — Member keeps current dates", "nextStep": "m_keep_dates_end"},
        {"label": "NO — Dates must change", "nextStep": "m_self_haul"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    3
);

-- M5: Keep dates end
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_keep_dates_end',
    'No Changes Needed',
    'The member has decided to keep the current dates. No further action is needed.

Document that the member was contacted and opted to keep the original schedule.',
    'info',
    'firework',
    NULL,
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    4
);

-- M6: Self haul?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_self_haul',
    'Is This a Self-Haul Shipment?',
    'Determine if the shipment is a self-haul (Personally Procured Move / PPM) or a government-arranged carrier move.

Self-haul shipments follow a different path because the member controls the transportation.',
    'decision',
    'iron_pickaxe',
    NULL,
    '[
        {"label": "YES — Self-haul / PPM", "nextStep": "m_self_haul_dates"},
        {"label": "NO — Government carrier", "nextStep": "m_which_dates"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    5
);

-- M7: Self-haul — which dates changing
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_self_haul_dates',
    'Self-Haul: Which Dates Are Changing?',
    'For self-haul shipments, identify which dates the member needs to change. This determines what needs to be updated in the system.',
    'decision',
    'clock',
    NULL,
    '[
        {"label": "Both dates (pack and pickup)", "nextStep": "m_update_both_selfhaul"},
        {"label": "Load/pickup date only", "nextStep": "m_update_load_selfhaul"},
        {"label": "Pack date only", "nextStep": "m_update_pack_selfhaul"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    6
);

-- M8: Self-haul update both
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_update_both_selfhaul',
    'Update Both Dates (Self-Haul)',
    'Update both the pack date and pickup/load date in the system for this self-haul shipment.

Proceed to the update checklist to complete all required system changes.',
    'info',
    'paper',
    'm_update_checklist_selfhaul',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    7
);

-- M9: Self-haul update load only
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_update_load_selfhaul',
    'Update Load Date Only (Self-Haul)',
    'Update only the pickup/load date in the system. The pack date remains unchanged.',
    'info',
    'paper',
    'm_update_checklist_selfhaul',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    8
);

-- M10: Self-haul update pack only
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_update_pack_selfhaul',
    'Update Pack Date Only (Self-Haul)',
    'Update only the pack date in the system. The load/pickup date remains unchanged.',
    'info',
    'paper',
    'm_update_checklist_selfhaul',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    9
);

-- M11: Self-haul update checklist
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_update_checklist_selfhaul',
    'Self-Haul Update Checklist',
    'Complete the following updates for the self-haul date change:

• MR dates
• Atlas dates (if needed)
• Date change notes
• DPS Remarks
• Outbound OT
• 3rd party (if needed)

Verify all entries are accurate before closing.',
    'info',
    'book',
    NULL,
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    10
);

-- M12: Which dates (government carrier)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_which_dates',
    'Which Dates Are Changing?',
    'Identify which dates the member needs changed. This affects which agents need to be coordinated and what system updates are required.',
    'decision',
    'clock',
    NULL,
    '[
        {"label": "Both dates (pack and pickup)", "nextStep": "m_one_agent_accommodate"},
        {"label": "Load/pickup date only", "nextStep": "m_one_agent_accommodate"},
        {"label": "Pack date only", "nextStep": "m_one_agent_accommodate"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    11
);

-- M13: Can one of the agents accommodate?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_one_agent_accommodate',
    'Can One of the Agents Accommodate?',
    'If one agent can accommodate but the other cannot, you may need to proceed differently.

NOTE: A pocketbook would need to be moved. If the shipment is large, the OA may not be able to secure a new carrier on short notice.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "YES — At least one can", "nextStep": "m_lock_dates"},
        {"label": "NO — Neither can accommodate", "nextStep": "m_no_change"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    12
);

-- M14: Lock in dates
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_lock_dates',
    'Lock In Dates & Update Hauler',
    'Lock in the new dates and remove the current hauler if needed. Put the shipment on the spreadsheet for a new hauler assignment for the new date.

Contact OAHA and make notes that the driver is not packing this shipment if applicable.',
    'info',
    'sign',
    'm_can_ha_pack',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    13
);

-- M15: Can HA pack?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_can_ha_pack',
    'Can the HA Pack?',
    'Check if the Hauler Agent can handle the packing for this shipment on the new dates.',
    'decision',
    'iron_pickaxe',
    NULL,
    '[
        {"label": "YES", "nextStep": "m_premove_check"},
        {"label": "NO", "nextStep": "m_premove_check"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    14
);

-- M16: Has premove been entered?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_premove_check',
    'Has Premove Been Entered?',
    'Check if a premove survey has already been entered for this shipment. This affects whether spread and survey steps apply.

A premove survey records the estimated weight and inventory of household goods.',
    'decision',
    'book',
    NULL,
    '[
        {"label": "YES — Premove is entered", "nextStep": "m_spread_check"},
        {"label": "NO — No premove yet", "nextStep": "m_spread_check_no_premove"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    15
);

-- M17: Is new load date within spread? (with premove)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_spread_check',
    'Is New Load Date Within Spread?',
    'The "spread" is the allowable pickup date window. Check whether the member''s requested new load date falls within the approved spread window.

Use the RDD Calculator to verify: enter the new dates and check if the load date falls between the earliest and latest pickup dates.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "YES — Within spread", "nextStep": "m_7gbl_check"},
        {"label": "NO — Out of spread", "nextStep": "m_email_out_of_spread"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    16
);

-- M18: Is new load date within spread? (no premove)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_spread_check_no_premove',
    'Is New Load Date Within Spread?',
    'Even without a premove entered, check the spread window for the new dates.

Without a premove, the process for out-of-spread handling differs.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "YES — Within spread", "nextStep": "m_7gbl_check_no_premove"},
        {"label": "NO — Out of spread", "nextStep": "m_email_out_no_survey"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    17
);

-- M19: 7 GBL check (with premove, in spread)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_7gbl_check',
    'Within 7 GBLs of Planned Load Date?',
    'Is the new load date within 7 GBLs (Government Bill of Lading days) prior to the originally planned load date?

This threshold determines whether a GBL update is required.',
    'decision',
    'paper',
    NULL,
    '[
        {"label": "YES — Within 7 GBLs", "nextStep": "m_email_in_spread_gbl"},
        {"label": "NO — Outside 7 GBLs", "nextStep": "m_email_in_spread"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    18
);

-- M20: 7 GBL check (no premove, in spread)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_7gbl_check_no_premove',
    'Within 7 GBLs of Planned Load Date?',
    'Is the new load date within 7 GBLs prior to the planned load date? (No premove entered)',
    'decision',
    'paper',
    NULL,
    '[
        {"label": "YES — Within 7 GBLs", "nextStep": "m_email_in_spread_gbl"},
        {"label": "NO — Outside 7 GBLs", "nextStep": "m_confirm_signature"}
    ]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    19
);

-- M21: Email — Out of spread (survey entered)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_email_out_of_spread',
    'Email: Out of Spread — Survey Entered',
    'Get member email and ask base (JPPSO) to:
• Update planned dates in DPS
• Issue spread override due to member/base convenience

Since the dates are OUT of spread and a survey HAS been entered, an override is required.

Obtain the member''s signature confirming the date change.',
    'info',
    'paper',
    'm_confirm_signature',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    20
);

-- M22: Email — Out of spread, no survey
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_email_out_no_survey',
    'Email: Out of Spread — No Survey',
    'Get member email and ask base to update spread.

Since the dates are OUT of spread and NO survey has been entered:
• Update the planned dates
• Note that no survey/premove exists

Obtain the member''s signature.',
    'info',
    'paper',
    'm_confirm_signature',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    21
);

-- M23: Email — In spread, within 7 GBL
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_email_in_spread_gbl',
    'Email: In Spread — GBL Update Required',
    'Get member email and ask base (JPPSO) to:
• Update planned dates in DPS
• Issue updated GBL

Since the dates are WITHIN spread but within 7 GBLs of the planned date, a GBL update is needed.

Confirm: in spread / survey entered / signature obtained.',
    'info',
    'paper',
    'm_confirm_signature',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    22
);

-- M24: Email — In spread, standard
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_email_in_spread',
    'Email: In Spread — Standard Update',
    'Get member email and ask base to:
• Update planned dates in DPS and on GBL

Dates are within spread — this is the standard process.

Confirm: in spread / survey entered / signature obtained.',
    'info',
    'paper',
    'm_confirm_signature',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    23
);

-- M25: Confirm with member signature
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_confirm_signature',
    'Confirm with Member Signature',
    'Obtain the member''s signature or written confirmation (email) acknowledging the date change.

This is required for documentation and audit trail purposes. Without member confirmation, the date change should not proceed.',
    'info',
    'sign',
    'm_update',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    24
);

-- M26: Update
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_update',
    'Apply Updates',
    'Apply all date changes in the system. Make sure the new dates are reflected across all platforms.',
    'info',
    'compass',
    'm_update_checklist',
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    25
);

-- M27: Update checklist (final)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'm_update_checklist',
    'Update Checklist',
    'Complete the following update checklist:

✓ MR dates — Update the move request dates
✓ Atlas dates (if needed) — Update in Atlas system
✓ Date change notes — Document the change and reason
✓ DPS Remarks — Add remarks in DPS
✓ Outbound OT — Update outbound office tracking
✓ 3rd party (if needed) — Notify third-party vendors

Verify all entries are accurate. This completes the member-requested date change process.',
    'info',
    'book',
    NULL,
    '[]'::jsonb,
    'b1b2c3d4-0001-4000-8000-000000000001',
    26
);


-- ============================================================================
-- AGENT-REQUESTED DATE CHANGE STEPS (~27 steps)
-- ============================================================================

-- A1: Start - Overview
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_overview',
    'Agent-Requested Date Change',
    'An agent has requested a date change for a shipment. This could be the Delivery Agent (DA) or Hauler Agent (HA).

The process differs based on which agent is requesting and whether the change affects packing days. Follow the decision tree carefully.',
    'info',
    'book',
    'a_da_or_ha',
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    0
);

-- A2: Is DA or HA requesting?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_da_or_ha',
    'Is DA or HA Requesting?',
    'Identify which agent is requesting the date change:

• DA (Delivery Agent) — The agent at the destination
• HA (Hauler Agent) — The agent handling transportation

This determines the approval path and who needs to be coordinated.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "DA — Delivery Agent", "nextStep": "a_affect_packing_da"},
        {"label": "HA — Hauler Agent", "nextStep": "a_affect_packing_ha"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    1
);

-- A3: Does it affect packing days? (DA)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_affect_packing_da',
    'Does It Affect Packing Days? (DA Request)',
    'Determine if the DA''s requested date change affects the packing schedule.

If packing days are affected, more coordination is needed with the origin side.',
    'decision',
    'clock',
    NULL,
    '[
        {"label": "YES — Packing days affected", "nextStep": "a_both_accommodate"},
        {"label": "NO — Packing not affected", "nextStep": "a_hauler_assigned"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    2
);

-- A4: Does it affect packing days? (HA)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_affect_packing_ha',
    'Does It Affect Packing Days? (HA Request)',
    'Determine if the HA''s requested date change affects the packing schedule.

Since the HA handles transportation, their changes may or may not affect packing.',
    'decision',
    'clock',
    NULL,
    '[
        {"label": "YES — Packing days affected", "nextStep": "a_both_accommodate"},
        {"label": "NO — Packing not affected", "nextStep": "a_hauler_assigned"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    3
);

-- A5: Can both agents accommodate?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_both_accommodate',
    'Can Both Agents Accommodate?',
    'Contact both agents to verify the new dates work for everyone.

Both the origin and destination sides need to confirm availability for the requested dates.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "YES — Both can accommodate", "nextStep": "a_hauler_assigned"},
        {"label": "NO — Cannot accommodate", "nextStep": "a_duty_agent_escalate"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    4
);

-- A6: Duty Agent escalation (cannot accommodate)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_duty_agent_escalate',
    'Escalate to Duty Agent',
    'The agents cannot accommodate the requested dates. Escalate to the Duty Agent for further action.

The Duty Agent will determine next steps, which may include finding alternative agents or denying the request.',
    'info',
    'golden_helmet',
    NULL,
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    5
);

-- A7: Is hauler assigned?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_hauler_assigned',
    'Is a Hauler Assigned?',
    'Check if a hauler has already been assigned to this shipment.

If a hauler is assigned, additional coordination is needed to change dates. If not, the process is simpler.',
    'decision',
    'iron_pickaxe',
    NULL,
    '[
        {"label": "YES — Hauler is assigned", "nextStep": "a_notify_member"},
        {"label": "NO — No hauler yet", "nextStep": "a_notify_member"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    6
);

-- A8: Notify/Confirm with member
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_notify_member',
    'Notify Member of Date Change',
    'Since the agent (not the member) is requesting this change, you must notify the member and get their confirmation.

Contact the member to explain the requested date change and get their approval or denial.',
    'info',
    'paper',
    'a_confirm_member',
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    7
);

-- A9: Confirm with member
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_confirm_member',
    'Member Response',
    'What is the member''s response to the agent-requested date change?

The member has the right to accept or deny the date change.',
    'decision',
    'sign',
    NULL,
    '[
        {"label": "ACCEPTED — Member agrees", "nextStep": "a_premove_check"},
        {"label": "DENIED — Member refuses", "nextStep": "a_denied_duty_agent"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    8
);

-- A10: Denied — Duty Agent
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_denied_duty_agent',
    'Member Denied — Escalate to Duty Agent',
    'The member has denied the agent''s date change request. Escalate to the Duty Agent.

The Duty Agent will work with all parties to find a resolution. Document the member''s denial and reason.',
    'info',
    'golden_helmet',
    NULL,
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    9
);

-- A11: Has premove been entered?
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_premove_check',
    'Has Premove Been Entered?',
    'Check if a premove survey has been entered for this shipment.

This affects the spread check and subsequent documentation requirements.',
    'decision',
    'book',
    NULL,
    '[
        {"label": "YES — Premove entered", "nextStep": "a_spread_check"},
        {"label": "NO — No premove", "nextStep": "a_spread_check_no_premove"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    10
);

-- A12: Is new load date within spread? (premove entered)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_spread_check',
    'Is New Load Date Within Spread?',
    'Check if the new load date falls within the approved spread window.

Use the RDD Calculator to verify the spread dates for the new schedule.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "YES — Within spread", "nextStep": "a_7gbl_check"},
        {"label": "NO — Out of spread", "nextStep": "a_email_out_of_spread"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    11
);

-- A13: Is new load date within spread? (no premove)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_spread_check_no_premove',
    'Is New Load Date Within Spread?',
    'Check the spread window even without a premove entered.',
    'decision',
    'compass',
    NULL,
    '[
        {"label": "YES — Within spread", "nextStep": "a_7gbl_check"},
        {"label": "NO — Out of spread", "nextStep": "a_email_out_no_survey"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    12
);

-- A14: 7 GBL check
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_7gbl_check',
    'Within 7 GBLs of Planned Load Date?',
    'Is the new load date within 7 GBLs prior to the planned load date?

This determines whether a GBL update is required alongside the date change.',
    'decision',
    'paper',
    NULL,
    '[
        {"label": "YES — Within 7 GBLs", "nextStep": "a_email_in_spread_gbl"},
        {"label": "NO — Outside 7 GBLs", "nextStep": "a_email_in_spread"}
    ]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    13
);

-- A15: Email — Out of spread (survey entered)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_email_out_of_spread',
    'Email: Out of Spread — Survey Entered',
    'Get confirmation email from member and ask base (JPPSO) to:
• Update planned dates in DPS
• Issue spread override

Since dates are OUT of spread with a survey entered, an override is required.

Confirm: out of spread / survey entered / signature.',
    'info',
    'paper',
    'a_update',
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    14
);

-- A16: Email — Out of spread, no survey
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_email_out_no_survey',
    'Email: Out of Spread — No Survey',
    'Get confirmation email from member and ask base to update.

Dates are OUT of spread with NO survey entered.',
    'info',
    'paper',
    'a_update',
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    15
);

-- A17: Email — In spread, GBL update
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_email_in_spread_gbl',
    'Email: In Spread — GBL Update Required',
    'Get confirmation email from member and ask base (JPPSO) to:
• Update planned dates in DPS
• Issue updated GBL

Dates are WITHIN spread but within 7 GBLs — GBL update needed.

Confirm: in spread / survey entered / signature.',
    'info',
    'paper',
    'a_update',
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    16
);

-- A18: Email — In spread, standard
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_email_in_spread',
    'Email: In Spread — Standard Update',
    'Get confirmation email from member and ask base to:
• Update planned dates in DPS and on GBL

Standard in-spread date change — straightforward process.',
    'info',
    'paper',
    'a_update',
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    17
);

-- A19: Update
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_update',
    'Apply Updates',
    'Apply all date changes in the system. Verify the new dates are reflected accurately across all platforms.',
    'info',
    'compass',
    'a_update_checklist',
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    18
);

-- A20: Update checklist (final)
INSERT INTO public.training_steps (id, title, content, type, icon, next_step, options, scenario_id, display_order)
VALUES (
    'a_update_checklist',
    'Update Checklist',
    'Complete the following update checklist for agent-requested date changes:

✓ MR dates — Update the move request dates
✓ Atlas dates (if needed) — Update in Atlas system
✓ Date change notes — Document the change and reason
✓ DPS Remarks — Add remarks in DPS
✓ Outbound OT — Update outbound office tracking
✓ No Accident verification — Confirm no accident on record
✓ 3rd party (if needed) — Notify third-party vendors

Verify all entries are accurate. This completes the agent-requested date change process.',
    'info',
    'book',
    NULL,
    '[]'::jsonb,
    'b1b2c3d4-0002-4000-8000-000000000001',
    19
);

-- Re-enable FK after all steps are inserted
ALTER TABLE public.training_steps
ADD CONSTRAINT training_steps_next_step_fkey
FOREIGN KEY (next_step) REFERENCES public.training_steps(id) ON DELETE SET NULL;
