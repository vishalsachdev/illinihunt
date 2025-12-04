#!/bin/bash
# Purge Cloudflare cache for illinihunt.org
# Usage: export CLOUDFLARE_API_TOKEN='your-token' && ./scripts/purge-cloudflare-cache.sh

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN environment variable not set"
    echo ""
    echo "To get your API token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token' or use existing token with Zone.Cache Purge permissions"
    echo ""
    echo "Usage: export CLOUDFLARE_API_TOKEN='your-token' && ./scripts/purge-cloudflare-cache.sh"
    exit 1
fi

python3 <<'SCRIPT'
import json
import os
import urllib.request
import urllib.error

ZONE_NAME = "illinihunt.org"
API_BASE = "https://api.cloudflare.com/client/v4"

def make_api_request(endpoint, method="GET", data=None):
    """Make authenticated request to Cloudflare API"""
    api_token = os.environ.get('CLOUDFLARE_API_TOKEN')
    if not api_token:
        raise ValueError("CLOUDFLARE_API_TOKEN environment variable not set")

    url = f"{API_BASE}{endpoint}"
    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }

    request_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=request_data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"API Error: {e.code} - {error_body}")
        raise

# Get zone ID
print(f"🔍 Getting zone ID for {ZONE_NAME}...")
response = make_api_request(f"/zones?name={ZONE_NAME}")
if not response.get('success'):
    raise ValueError(f"Failed to get zone ID: {response.get('errors')}")

zones = response.get('result', [])
if not zones:
    raise ValueError(f"Zone {ZONE_NAME} not found")

zone_id = zones[0]['id']
print(f"✓ Zone ID: {zone_id}")

# Purge all cache
print(f"\n🗑️  Purging ALL cache for {ZONE_NAME}...")
purge_data = {"purge_everything": True}
response = make_api_request(f"/zones/{zone_id}/purge_cache", method="POST", data=purge_data)

if response.get('success'):
    print(f"\n✅ SUCCESS! Cache purged for {ZONE_NAME}")
    print(f"✓ All cached files have been cleared")
    print(f"\n⏱️  Wait 30 seconds, then hard refresh your browser (Cmd+Shift+R)")
    print(f"🌐 Test URL: https://www.illinihunt.org")
else:
    print(f"\n❌ Failed to purge cache: {response.get('errors')}")
    exit(1)

SCRIPT
