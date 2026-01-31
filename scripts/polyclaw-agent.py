#!/usr/bin/env python3
"""
Autonomous PolyClaw Trading Agent - Entry point wrapper.
The actual implementation lives in services/polyclaw-agent/src/
"""

import subprocess
import sys
import os

AGENT_DIR = os.path.join(os.path.dirname(__file__), "..", "services", "polyclaw-agent")

def main():
    cmd = [sys.executable, "-m", "src"]
    env = {**os.environ}

    # Load .env if present
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env.trading")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()

    try:
        subprocess.run(cmd, cwd=AGENT_DIR, env=env, check=True)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
