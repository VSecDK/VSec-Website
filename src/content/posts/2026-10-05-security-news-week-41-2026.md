---
title: "Security News — week 41 2026"
description: "Weekly overview of cybersecurity incidents and news from VSec."
author: "VSec AI"
date: 2026-10-05
tags: ["newsletter","security"]
readingTime: "8 min"
---

> **AI-generated content** — This newsletter is automatically compiled from public search results and has not been independently verified. All claims should be checked against the linked sources before being acted upon.

## Weekly Overview

This week has seen significant cybersecurity incidents affecting Danish organisations and citizens. A major breach involving the compromise of approximately 8.8 million CPR numbers has raised concerns about data protection and privacy. Additionally, Danmarks Tekniske Universitet (DTU) has been hit by a serious hacker attack, potentially exposing the data of up to 200,000 individuals. These incidents highlight the ongoing threat of cyberattacks in Denmark and the need for vigilance among organisations and individuals alike.

## 🇩🇰 Denmark & Nordic

### CPR Number Breach

A significant data breach has occurred in Denmark, resulting in the compromise of approximately 8.8 million CPR numbers. The breach is believed to have occurred through a Danish company that had access to the CPR system. The incident has sparked concerns about data protection and the potential for identity theft. According to reports, all relevant authorities are working to investigate the breach and mitigate its impact.

The CPR system is a critical infrastructure in Denmark, containing sensitive personal information about citizens. The breach has raised questions about the security measures in place to protect this data. While the full extent of the breach is still being investigated, it is clear that this incident has significant implications for data protection and privacy in Denmark.

**Sources:** [https://nyheder.tv2.dk/live/samfund/2026-10-05-cpr-numre-kompromitteret](https://nyheder.tv2.dk/live/samfund/2026-10-05-cpr-numre-kompromitteret) [https://nyheder.tv2.dk/live/samfund/2026-10-05-uvedkommende-har-faaet-adgang-til-88-millioner-cpr-numre](https://nyheder.tv2.dk/live/samfund/2026-10-05-uvedkommende-har-faaet-adgang-til-88-millioner-cpr-numre)

### DTU Hacker Attack

Danmarks Tekniske Universitet (DTU) has been the victim of a serious hacker attack, potentially exposing the data of up to 200,000 individuals. The attack is believed to have occurred through a vulnerability in the university's internal system, DTUBasen. The incident has been described as "alvorligt" (serious) by experts, highlighting the significant risk to personal data.

The attack on DTU has raised concerns about the cybersecurity measures in place at Danish universities and institutions. While the full extent of the breach is still being investigated, it is clear that this incident has significant implications for data protection and cybersecurity in Denmark's education sector.

**Sources:** [https://nyheder.tv2.dk/samfund/2026-10-02-dtu-ramt-af-alvorligt-hackerangreb-op-mod-200000-kan-vaere-beroert](https://nyheder.tv2.dk/samfund/2026-10-02-dtu-ramt-af-alvorligt-hackerangreb-op-mod-200000-kan-vaere-beroert) [https://www.dr.dk/nyheder/indland/ekspert-kalder-hackerangreb-paa-dtu-rigtig-stort-og-alvorligt](https://www.dr.dk/nyheder/indland/ekspert-kalder-hackerangreb-paa-dtu-rigtig-stort-og-alvorligt)

## 🌍 European & Global

There are no major international incidents directly relevant to Danish organisations this week.

## 🤖 AI & Emerging Threats

There are no AI-related threats or incidents relevant to Danish organisations this week.

## 📋 Policy & Compliance

There are no regulatory or policy updates relevant to Danish organisations this week.

## 🔗 Quick Links

- **CPR Number Breach** — A breach has compromised approximately 8.8 million CPR numbers in Denmark. [https://nyheder.tv2.dk/live/samfund/2026-10-05-cpr-numre-kompromitteret](https://nyheder.tv2.dk/live/samfund/2026-10-05-cpr-numre-kompromitteret)
- **DTU Hacker Attack** — Danmarks Tekniske Universitet has been hit by a serious hacker attack, potentially exposing the data of up to 200,000 individuals. [https://nyheder.tv2.dk/samfund/2026-10-02-dtu-ramt-af-alvorligt-hackerangreb-op-mod-200000-kan-vaere-beroert](https://nyheder.tv2.dk/samfund/2026-10-02-dtu-ramt-af-alvorligt-hackerangreb-op-mod-200000-kan-vaere-beroert)
- **Cyber Threats in Denmark** — The cyber threat level in Denmark is considered high, with many organisations experiencing attempted security breaches. [https://www.fe-ddis.dk/da/arbejdsomrade-a/Cybertruslen/](https://www.fe-ddis.dk/da/arbejdsomrade-a/Cybertruslen/)

## Top 5 Noteworthy Vulnerabilities This Week

### CVE-2026-40281 | Gotenberg | Arbitrary Command Injection

**CVSS: 10 (CRITICAL)** | **EPSS: 0.0%** | **Sightings last 7 days: 3**
Gotenberg is a Docker-powered stateless API for PDF files. In versions 8.30.1 and earlier, the metadata write endpoint validates metadata keys for control characters but leaves metadata values unsanitized. A newline character in a metadata value splits the ExifTool stdin line into two separate arguments, allowing injection of arbitrary ExifTool pseudo-tags. This vulnerability can be exploited by remote attackers to execute arbitrary commands on the system.

**CIRCL Advisory:** [https://vulnerability.circl.lu/vuln/CVE-2026-40281](https://vulnerability.circl.lu/vuln/CVE-2026-40281)
**References:**
- https://github.com/gotenberg/gotenberg/security/advisories/GHSA-q7r4-hc83-hf2q
- https://github.com/gotenberg/gotenberg/commit/405f1069c026bb08f319fb5a44e5c67c33208318

### CVE-2026-105285 | Totolink A3002MU | Stack-Based Buffer Overflow

**CVSS: 10 (CRITICAL)** | **EPSS: 0.0%** | **Sightings last 7 days: 5**
A security vulnerability has been detected in Totolink A3002MU 1.0.0-B20230403.1455. This affects an unknown function of the file /boafrm/formIpQoS of the component QoS Rule Handler. The manipulation of the argument addQos/comment/entry_name leads to stack-based buffer overflow. Remote exploitation of the attack is possible.

**CIRCL Advisory:** [https://vulnerability.circl.lu/vuln/CVE

---

## Upcoming Events

<!-- TODO: Paste upcoming events from the VSec events worker before merging -->

_No events listed this week — check [vsec.dk/events](/events) for the latest._

---

## Want to Learn More?

Looking for more cybersecurity news, in-depth guides, podcasts, and recommended reading? Head over to our [Learning Section](/learning) where we curate the best resources to keep you up to date with the ever-changing threat landscape.

---

> _This newsletter is automatically generated by VSec's AI newsletter generator based on publicly available search results. Always verify information independently before acting on it._
