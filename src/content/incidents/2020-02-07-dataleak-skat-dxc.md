---
company: Skatteforvaltningen (TastSelv Borger / DXC Technology)
sector: Public Sector / Tax
actor: None (software defect)
date: 2020-02-07
type: dataleak
---

## Description

A software defect in the public self-service system TastSelv Borger placed citizens' CPR numbers inside URLs, which were then transmitted to Google and Adobe as part of ordinary web requests. The defect triggered when a citizen logged in and used "Ret kontaktoplysninger".

Approximately 1.26 million citizens were affected. The leak ran from 2 February 2015 to 24 January 2020 — nearly five years — before it was discovered on 21 January 2020 by Udviklings- og Forenklingsstyrelsen during an inspection of the system, which was operated by DXC Technology (the former CSC).

Not an attack, and included here for that reason: it is the largest Danish CPR exposure of the period, and it happened through a mundane referrer-leak pattern in a system nobody was attacking. Udviklings- og Forenklingsstyrelsen assessed that the data was not misused.

## Timeline

- 2015-02-02: Defect introduced; CPR numbers begin leaking via URLs
- 2020-01-21: Discovered during inspection of TastSelv Borger
- 2020-01-24: Leak stopped
- 2020-02-07: Disclosed publicly

## References

- [TV 2 — 1,2 millioner cpr-numre lækket ved en fejl](https://nyheder.tv2.dk/samfund/2020-02-07-12-millioner-cpr-numre-laekket-ved-en-fejl)
- [DR — 1,2 millioner danskere har fået cpr-numre lækket](https://www.dr.dk/nyheder/penge/12-millioner-danskere-har-faaet-cpr-numre-laekket)
- [Version2 — DXC har lækket over 1,2 mio. borgeres cpr-numre i web-adresser](https://www.version2.dk/artikel/dxc-har-laekket-over-12-mio-borgeres-cpr-numre-i-web-adresser)
- [Version2 — Data-læk fra TastSelv: DXC sendte 3300 CPR-numre til amerikansk leverandør](https://version2.dk/artikel/data-laek-tastselv-dxc-sendte-3300-cpr-numre-amerikansk-leverandoer-1090841)
