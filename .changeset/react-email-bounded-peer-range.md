---
"@openuidev/react-email": minor
---

`@openuidev/react-lang` peer dependency now declares a bounded
tested-compatibility range (`">=0.3.0 <0.4.0"`) instead of an exact pin.
Minor (breaking) because the new floor excludes react-lang 0.2.x: upgrade
react-lang together with react-email.
