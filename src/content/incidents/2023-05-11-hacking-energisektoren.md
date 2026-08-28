---
company: Danish energy and heating sector (22 companies)
sector: Energy / Critical Infrastructure
actor: Disputed — see below
date: 2023-05-11
type: hacking
---

## Description

In May 2023, 22 Danish energy and district heating companies were compromised through vulnerabilities in Zyxel firewalls used as internet-facing edge devices — principally CVE-2023-28771, disclosed roughly a week before the first wave. SektorCERT, which operates a sensor network across the Danish critical infrastructure sectors, detected and coordinated the response.

Attacks came in waves: the first from 11 May, a second from 22 May. In the second phase, attackers reached industrial control systems at multiple companies. Several operators disconnected compromised systems from the internet and ran in island mode to contain the damage. SektorCERT's November 2023 report described it as the most extensive attack on Danish critical infrastructure to date, with up to ~100,000 customers potentially affected in a worst case.

**Attribution is contested, and that is part of why this case is worth studying.** SektorCERT's report was widely read as implying a coordinated state operation with possible Sandworm involvement. In January 2024, Forescout published an analysis concluding that the two waves were unrelated: the second was part of an indiscriminate mass-exploitation campaign against unpatched firewalls, not a targeted operation against Denmark, and Sandworm could not be tied to both waves. The honest summary is that a genuinely serious event was, on later evidence, less targeted than first reported.

## Timeline

- 2023-04: Zyxel discloses CVE-2023-28771, roughly a week before the first wave
- 2023-05-11: First wave of attacks against multiple companies simultaneously
- 2023-05-22: Second wave begins; ICS reached at multiple companies
- 2023-05: Several companies isolate systems and run in island mode
- 2023-11-12: SektorCERT publishes its report
- 2024-01: Forescout publishes analysis disputing the targeted-attack and Sandworm framing

## References

- [SektorCERT — Angrebet mod dansk, kritisk infrastruktur (TLP:CLEAR, november 2023)](https://sektorcert.dk/wp-content/uploads/2023/11/SektorCERT-Angrebet-mod-dansk-kritisk-infrastruktur-TLP-CLEAR.pdf)
- [SektorCERT — Publikationer](https://sektorcert.dk/publikationer/)
- [DKCERT — Angreb på energisektoren udnyttede sårbarhed i firewall](https://www.cert.dk/da/news/2023-11-14/Angreb-paa-energisektoren-udnyttede-saarbarhed-i-firewall)
- [DR — Rapport: Energisektoren ramt af det 'hidtil mest omfangsrige' cyberangreb](https://www.dr.dk/nyheder/viden/teknologi/rapport-energisektoren-ramt-af-det-hidtil-mest-omfangsrige-cyberangreb)
- [TV 2 — Historisk angreb mod dansk infrastruktur afværget](https://nyheder.tv2.dk/samfund/2023-11-12-stoerste-angreb-mod-dansk-infrastruktur-nogensinde-afvaerget-tegn-paa-statslig-indblanding-siger-energisektor)
- [Forescout — Clearing the Fog of War: analysis of energy sector cyberattacks in Denmark and Ukraine](https://www.forescout.com/blog/analysis-of-energy-sector-cyberattacks-in-denmark-and-ukraine/)
- [DR — Forsyningsselskaber får kritik efter historisk cyberangreb](https://www.dr.dk/nyheder/viden/teknologi/forsyningsselskaber-faar-kritik-efter-historisk-cyberangreb-vi-er-heldige)
