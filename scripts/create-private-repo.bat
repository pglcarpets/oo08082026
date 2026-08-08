@echo off
cd /d "e:\Websites\oo05082026"
if not exist results mkdir results
gh auth status > results\repo-create.out 2>&1
echo. >> results\repo-create.out
echo === CREATE REPO === >> results\repo-create.out
gh repo create oo05082026 --private --description "OO Studio / Planner" >> results\repo-create.out 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> results\repo-create.out
gh repo view ayushonmicrosoft/oo05082026 >> results\repo-create.out 2>&1
