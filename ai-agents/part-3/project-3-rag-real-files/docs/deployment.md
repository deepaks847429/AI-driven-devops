# Deployment Guide

Our deployment policy allows deploys only on weekdays between 10am and 4pm. Deploys are frozen on Fridays after 2pm and on public holidays to reduce weekend risk.

Every deploy must go through the CI pipeline, which runs unit tests, security scans, and a staging smoke test. A deploy cannot be promoted to production unless all three pass.

To roll back a bad release, run `kubectl rollout undo deploy/<name> -n <namespace>`. Always announce a rollback in the #deploys Slack channel so the team is aware.
