"""Code shared by every backend service.

This folder is the single source of truth. bin/sync-backend-shared.sh copies it
into each service as `shared/` before running or deploying, because each Lambda
is packaged from its own folder only. Edit files here, never the copies.
"""
