# Build and dependency provenance

This standalone app matches Antenna for Hermes **1.6.9**, schema 2, the
`antenna-plugin-v2` wire profile and `antenna-limits-2` scanner bounds.
`SOURCE.json` pins every copied runtime dependency; `packaging/allowlists.json`
is the complete installable payload. No upstream checkout or download occurs.

```sh
python3 packaging/build.py --output /new/build-directory
```

Build from a clean committed checkout. The builder refuses changed shared pins,
creates a deterministic `antenna-diagnostics-hermes-1.6.9.tgz` and per-file manifest, and
never installs, uploads or edits a running profile. Keep the extracted app in its
own directory. Tests and build machinery are source-only, not runtime content.
