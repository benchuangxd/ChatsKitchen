-- Migration: seed Season 1
-- Created: 2026-04-22

INSERT INTO seasons (number, status, money_goal, total_money_earned, started_at)
VALUES (1, 'active', 500000, 0, now());
