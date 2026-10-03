@echo off
cd /d C:\Users\Admin\Documents\pwa-hub-fase1
python .\scripts\daily_concrete_defects_agent.py --data ontem >> .\relatorios\defeitos-concreto\diario\daily_agent.log 2>&1
