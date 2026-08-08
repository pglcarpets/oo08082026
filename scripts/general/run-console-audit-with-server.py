#!/usr/bin/env python3
"""Start Next.js dev server, run console audit, then kill server."""
import subprocess, time, os, sys, signal

def wait_for_server(url="http://localhost:3000", timeout=60):
    import urllib.request
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = urllib.request.urlopen(url, timeout=2)
            if r.status == 200:
                return True
        except Exception:
            pass
        time.sleep(1)
    return False

def main():
    print("Starting Next.js dev server...")
    env = os.environ.copy()
    env["NODE_ENV"] = "development"
    
    proc = subprocess.Popen(
        ["pnpm", "dev"],
        cwd=os.getcwd(),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    
    try:
        print("Waiting for server to be ready...")
        if not wait_for_server(timeout=60):
            print("Server did not start in time")
            proc.terminate()
            proc.wait(timeout=5)
            sys.exit(1)
        
        print("Server ready. Running console audit...")
        audit = subprocess.run(
            ["node", "scripts/general/console-audit.mjs"],
            cwd=os.getcwd(),
        )
        
        sys.exit(audit.returncode)
    finally:
        print("Shutting down server...")
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()

if __name__ == "__main__":
    main()
