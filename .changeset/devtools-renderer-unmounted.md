---
"@openuidev/react-lang": patch
"@openuidev/devtools": patch
---

Settle the devtools stream row when a Renderer unmounts mid-stream. It used to stay on "Streaming" forever; react-lang now publishes an `unmounted` stream event and devtools shows an "Interrupted" badge with the final duration.
