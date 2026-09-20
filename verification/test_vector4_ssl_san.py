#!/usr/bin/env python3
"""
Vector 4 Stress Test: SSL Certificate SAN Mismatch & Wildcard Vulnerabilities
Directly stress-tests lines 751-756 of axiom_os_stage_gate_verification_spec.md:
    san_names = [entry[1] for entry in cert.get('subjectAltName', []) if entry[0] == 'DNS']
    is_san_valid = hostname in san_names or any(
        s.startswith("*.") and hostname.endswith(s[1:]) for s in san_names
    )
    assert is_san_valid, f"Hostname {hostname} missing from SANs: {san_names}"
"""

import ssl

def evaluate_gate2_san_logic(cert_sans, hostname):
    san_names = [entry[1] for entry in cert_sans if entry[0] == 'DNS']
    is_san_valid = hostname in san_names or any(
        s.startswith("*.") and hostname.endswith(s[1:]) for s in san_names
    )
    return is_san_valid

def test_ssl_san_edge_cases():
    print("=== TEST 4.1: SSL SAN Wildcard RFC 6125 Compliance Stress Test ===")
    
    # Case 1: Multi-level subdomain under single-level wildcard
    cert_sans = [('DNS', '*.axiomrun.app')]
    hostname = "deep.nested.sub.axiomrun.app"
    result = evaluate_gate2_san_logic(cert_sans, hostname)
    print(f"Cert SAN: '*.axiomrun.app', Hostname: '{hostname}'")
    print(f"  Gate 2 Result: {result} (RFC 6125 strictly mandates FALSE: wildcards only match one level!)")
    if result is True:
        print("  [CONFIRMED SECURITY FLAW] Gate 2 falsely validates multi-level subdomain against single-level wildcard cert!")

    # Case 2: TLD Wildcard (*.com or *.co.uk)
    cert_sans_tld = [('DNS', '*.com')]
    hostname_victim = "bankofamerica.com"
    result_tld = evaluate_gate2_san_logic(cert_sans_tld, hostname_victim)
    print(f"Cert SAN: '*.com', Hostname: '{hostname_victim}'")
    print(f"  Gate 2 Result: {result_tld}")
    if result_tld is True:
        print("  [CONFIRMED SECURITY FLAW] Gate 2 accepts illegal TLD wildcards matching arbitrary domain names!")

    # Case 3: IPv4 address in SAN
    print("\n=== TEST 4.2: IPv4 Address SAN Matching Bug ===")
    cert_sans_ip = [('IP Address', '10.0.0.1'), ('DNS', 'localhost')]
    hostname_ip = "10.0.0.1"
    result_ip = evaluate_gate2_san_logic(cert_sans_ip, hostname_ip)
    print(f"Cert SAN: {cert_sans_ip}, Hostname: '{hostname_ip}'")
    print(f"  Gate 2 Result: {result_ip}")
    if result_ip is False:
        print("  [CONFIRMED BUG] Gate 2 ignores IP Address SAN entries (entry[0] == 'DNS' filter), failing valid internal IP endpoints!")

    # Case 4: Modern Python SSL Context & OpenSSL RFC 6125
    print("\n=== TEST 4.3: OpenSSL RFC 6125 Standard Behavior ===")
    print("  Note: In modern OpenSSL / Python 3.12+, hostname validation is performed during handshake.")
    print("  Gate 2's custom manual string matching overrides standard behavior with flawed logic:")
    print("  - False Positive: Multi-level subdomains matching single-level wildcards.")
    print("  - False Positive: Top-level domain (TLD) wildcards.")
    print("  - False Negative: IPv4 SANs completely omitted.")

if __name__ == "__main__":
    test_ssl_san_edge_cases()
