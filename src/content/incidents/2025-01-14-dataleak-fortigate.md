---
company: Danish Fortinet customers (incl. DSV, Mærsk, Rigspolitiet)
sector: Multiple / Cross-sector
actor: Belsen Group
date: 2025-01-14
type: dataleak
---

## Description

On 14 January 2025 a threat actor calling itself the Belsen Group published, for free, a 1.6 GB dataset containing configuration files, IP addresses and VPN credentials for more than 15,000 FortiGate firewalls worldwide. The dump included per-device `configuration.conf` files and `vpn-passwords.txt`, some with plaintext passwords, along with private keys and firewall rules.

Danish organisations in the dump included DSV, Mærsk and the Danish police. Forsvarets Efterretningstjeneste warned Danish Fortinet customers and advised a series of precautions.

The data was not stolen in 2025. Analysis, including by Kevin Beaumont, tied it to exploitation of **CVE-2022-40684** in 2022 — meaning organisations that patched at the time, considered the matter closed, and never rotated the credentials in those configs were exposed again more than two years later by a disclosure they had no control over.

Included here as the collection's clearest example of an exposure whose blast radius is set by credential hygiene after patching, not by the patch itself.

## Timeline

- 2022-10: CVE-2022-40684 exploited as a zero-day; device configurations harvested
- 2025-01-14: Belsen Group publishes configs and VPN credentials for 15,000+ FortiGate devices
- 2025-01: Danish organisations including DSV, Mærsk and Rigspolitiet identified in the dataset; FE issues warning to Danish Fortinet customers

## References

- [Version2 — DSV, Mærsk og dansk politi ramt af globalt datalæk: FE advarer danske virksomheder](https://www.version2.dk/artikel/dsv-maersk-og-dansk-politi-ramt-af-globalt-datalaek-fe-advarer-danske-virksomheder)
- [Ingeniøren — DSV, Maersk, and Danish Police affected by global data leak: DDIS warns Danish companies](https://ing.dk/artikel/dsv-maersk-and-danish-police-affected-global-data-leak-ddis-warns-danish-companies)
- [Help Net Security — Configuration files for 15,000 Fortinet firewalls leaked](https://www.helpnetsecurity.com/2025/01/16/leaked-fortinet-fortigate-configs-vpn-credentials-ip-list/)
- [Infosecurity Magazine — New Hacking Group Leaks Configuration of 15,000 Fortinet Firewalls](https://www.infosecurity-magazine.com/news/hacking-group-leaks-config-15k/)
- [Censys — Massive FortiGate Config Leak: Assessing the Impact](https://censys.com/blog/fortigate-config-leak-impact/)
