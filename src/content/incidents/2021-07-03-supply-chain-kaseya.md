---
company: Multiple Danish organisations (Kaseya VSA)
sector: IT / MSP and customers
actor: REvil
date: 2021-07-03
type: supply-chain
---

## Description

The Kaseya VSA attack affected Danish MSPs and their customers via a zero-day vulnerability in Kaseya VSA. REvil exploited the vulnerability to distribute ransomware to thousands of organisations globally, including Danish ones.

**Danish domains identified in the REvil configuration file:**
i-trust.dk, danskretursystem.dk, systemate.dk, koko-nora.dk, hmsdanmark.dk, advokathuset.dk, kirkepartner.dk, expandet.dk, polymedia.dk, erstatningsadvokaterne.dk, hushavefritid.dk, team-montage.dk, oemands.dk, piajeppesen.dk

Not all organisations in the configuration file were necessarily compromised — some may appear due to prior attacks.

## Indicators of Compromise

- [IOC list (Google Sheets)](https://docs.google.com/spreadsheets/d/11AFPdK5A-7g484lfc0HmXdBrZpYI-Jhx4N1VwFXrcrQ/edit?usp=sharing)

## Detection Rules

- [Neo23x0 — REvil YARA rule](https://github.com/Neo23x0/signature-base/blob/master/yara/crime_revil_general.yar)

## References

- [BleepingComputer — REvil hits 200 companies in MSP supply chain attack](https://www.bleepingcomputer.com/news/security/revil-ransomware-hits-200-companies-in-msp-supply-chain-attack/)
- [The Record — REvil supply chain attack via malicious Kaseya update](https://therecord.media/revil-ransomware-executes-supply-chain-attack-via-malicious-kaseya-update/)
- [DoublePulsar — Kaseya supply chain attack](https://doublepulsar.com/kaseya-supply-chain-attack-delivers-mass-ransomware-event-to-us-companies-76e4ec6ec64b)
- [JoeSandbox — Analysis](https://www.joesandbox.com/analysis/443736/0/html)
- [Reddit — Critical ransomware incident in progress](https://www.reddit.com/r/msp/comments/ocggbv/crticial_ransomware_incident_in_progress/)
