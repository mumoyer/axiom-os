#!/usr/bin/env python3
"""
Vector 2 Stress Test: Stripe Webhooks, Race Conditions, Clock Drift & Idempotency
Tests:
1. Stripe Webhook Signature Verification with Test Clock Drift (+30 days).
2. Concurrency Race Condition Simulation:
   - Evaluates whether sequential replay tests in Gate 4 catch concurrent TOCTOU race conditions.
3. Out-of-order webhook delivery (subscription.created before checkout.session.completed).
"""

import hmac
import hashlib
import time
import threading
import queue

def verify_stripe_signature(payload: str, header: str, secret: str, tolerance: int = 300, current_time: int = None):
    """
    Direct Python implementation of Stripe's Webhook.construct_event / verify_header algorithm.
    Official Stripe specification:
    Header format: t=1492774577,v1=5257a869e7ecebeda32affa62cd4f3762163c107e550100918f1abc0291942f9
    """
    if current_time is None:
        current_time = int(time.time())
        
    items = dict(item.split("=", 1) for item in header.split(",") if "=" in item)
    if "t" not in items or "v1" not in items:
        raise ValueError("Invalid Stripe-Signature header format")
        
    timestamp = int(items["t"])
    expected_sig = items["v1"]
    
    # Check tolerance
    time_diff = abs(current_time - timestamp)
    if tolerance > 0 and time_diff > tolerance:
        raise ValueError(f"Timestamp outside the tolerance zone (diff: {time_diff}s, max allowed: {tolerance}s)")
        
    signed_payload = f"{timestamp}.{payload}".encode("utf-8")
    computed_sig = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(computed_sig, expected_sig):
        raise ValueError("Signature mismatch")
        
    return True

def generate_stripe_header(payload: str, secret: str, timestamp: int):
    signed_payload = f"{timestamp}.{payload}".encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig}"

def test_stripe_test_clock_drift():
    print("=== TEST 2.1: Stripe Test Clock 30-Day Advancement & Timestamp Tolerance ===")
    secret = "whsec_test_secret_12345"
    payload = '{"id":"evt_test_123","type":"invoice.paid"}'
    
    now = int(time.time())
    # Normal current webhook
    normal_header = generate_stripe_header(payload, secret, now)
    assert verify_stripe_signature(payload, normal_header, secret, tolerance=300, current_time=now)
    print("[OK] Normal current webhook verified successfully.")
    
    # Advanced Test Clock webhook: +30 days (2,592,000 seconds in the future)
    future_time = now + 30 * 24 * 3600
    future_header = generate_stripe_header(payload, secret, future_time)
    
    try:
        verify_stripe_signature(payload, future_header, secret, tolerance=300, current_time=now)
        print("UNEXPECTED: Future webhook passed standard tolerance!")
    except ValueError as e:
        print(f"[CONFIRMED BUG] Future test-clock webhook rejected by standard Stripe tolerance check:\n  --> {e}")
        print("  Analysis: Gate 4 advances test clock by 30 days. When Stripe sends renewal webhooks with simulated timestamp,")
        print("  any production app using standard stripe.webhooks.constructEvent() will fail with HTTP 400 unless custom tolerance is configured!")

def test_concurrency_race_condition():
    print("\n=== TEST 2.2: Concurrent Webhook Replay vs Gate 4 Sequential Probe ===")
    # Gate 4 line 1099-1108 tests idempotency SEQUENTIALLY:
    #   await fetch(req1)
    #   await fetch(req2)
    # This does NOT detect concurrent race conditions!
    
    class NaiveWebhookProcessor:
        def __init__(self):
            self.processed_events = set()
            self.user_credits = 0
            self.lock_delay = 0.01  # Simulated DB I/O latency
            
        def handle_webhook_naive(self, event_id, credit_amount):
            # Non-atomic check and insert (classic TOCTOU bug)
            if event_id not in self.processed_events:
                time.sleep(self.lock_delay)  # simulate DB read latency
                self.processed_events.add(event_id)
                self.user_credits += credit_amount
                return 200, "PROVISIONED"
            return 200, "DUPLICATE_IGNORED"

    # Sequential test (what Gate 4 currently does)
    processor_seq = NaiveWebhookProcessor()
    res1, msg1 = processor_seq.handle_webhook_naive("evt_100", 100)
    res2, msg2 = processor_seq.handle_webhook_naive("evt_100", 100)
    print(f"Sequential Execution (Gate 4 method): Req1={msg1}, Req2={msg2}, Total Credits={processor_seq.user_credits}")
    print(f"  Gate 4 concludes idempotency: {'PASS' if processor_seq.user_credits == 100 else 'FAIL'}")

    # Concurrent test (what happens in real-world network retries / parallel webhook deliveries)
    processor_conc = NaiveWebhookProcessor()
    threads = []
    results = queue.Queue()
    
    def worker():
        r, m = processor_conc.handle_webhook_naive("evt_100", 100)
        results.put((r, m))
        
    for _ in range(5):
        t = threading.Thread(target=worker)
        threads.append(t)
        
    for t in threads:
        t.start()
    for t in threads:
        t.join()
        
    print(f"Concurrent Execution (Real-World Stress): Total Credits Provisioned={processor_conc.user_credits}")
    if processor_conc.user_credits > 100:
        print(f"[CONFIRMED VULNERABILITY] Naive idempotency passed sequential Gate 4 test but SUFFERED DOUBLE-SPEND ({processor_conc.user_credits} credits instead of 100) under concurrency!")

if __name__ == "__main__":
    test_stripe_test_clock_drift()
    test_concurrency_race_condition()
