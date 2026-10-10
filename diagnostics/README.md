# Antenna Diagnostics Kit for Hermes — v1.6.9

Try malicious content screening rules against sample messages or your own
examples, without sending messages or changing your active settings. Use the diagnostics kit
matching your [Antenna for Hermes](https://github.com/ClawReefAntenna/antenna-hermes)
release. Antenna handles everyday agent messaging; this separate app helps you
evaluate its scanners.
[Download v1.6.9](https://github.com/ClawReefAntenna/antenna-diagnostics-hermes/releases/download/v1.6.9/antenna-diagnostics-hermes-1.6.9.tgz) and verify its
[SHA-256 checksum](https://github.com/ClawReefAntenna/antenna-diagnostics-hermes/releases/download/v1.6.9/SHA256SUMS) before extracting it into its own directory.
Run from this extracted kit with `node diagnostics/cli.mjs HOST COMMAND ...`.

## Try a message or a collection

The kit uses the same Malicious Content Scanning (MCS) helpers as the matching
messaging release. Start with a simple Dumb test, then try the bundled collection
or preview it without scanning:

```text
node diagnostics/cli.mjs /path/config.yaml test --text "meeting agenda" --json
node diagnostics/cli.mjs /path/config.yaml test --file one.txt --engine dumb
node diagnostics/cli.mjs /path/config.yaml test --stdin --engine dumb --output /new/private-report
node diagnostics/cli.mjs /path/config.yaml evaluate --engine dumb
node diagnostics/cli.mjs /path/config.yaml evaluate --engine dumb --preview --json
```

You can ask your agent: “Test these example messages with Dumb and show me any
missed attacks or harmless messages it flags.”

With Dumb or Both, `evaluate` and `test` accept `--ruleset /absolute/candidate.json`
for candidate rule evaluation without changing the active file. These commands
share the production scanner and leave your messages, inbox and policy unchanged.
See the [corpus format and authoring guide](../plugin/CORPORA.md).
`evaluate --corpus /path/tests.json` selects a custom labelled corpus for that
invocation; omitting it uses the bundled file. `--preview` validates without scanning.

### Compare Smart and Both

`evaluate` defaults to Smart; `test` defaults to Dumb. Choose `--engine dumb` for
offline evaluation. Smart is model-only, Both is Dumb-first with short-circuit,
and `model` is a model-only diagnostic alias. Off is not a diagnostic engine.

Smart/model sends selected message bodies to your configured model; Both does
so after a Dumb pass. Preview makes no model calls and never consumes stdin.
Evaluation leaves your selected model and live policy unchanged. To compare
models, select and run each explicitly; reports include model identities and
fingerprints. Saved reports can contain private text; see the detail controls below.

```text
node diagnostics/cli.mjs /path/config.yaml evaluate --engine smart --repeat 2 --output /new/private-report
node diagnostics/cli.mjs /path/config.yaml evaluate --engine both --json
node diagnostics/cli.mjs /path/config.yaml test --file one.txt --file two.txt --engine smart --expect benign
```

## Read the results

Default human output contains attacks caught, false positives, incomplete scans
and model requests. `--verbose` adds missed attack IDs/types/content, false-positive
IDs/content/rules or model findings, and incomplete IDs/reasons. Repetitions get
separate summaries. Requested JSON report files retain detailed diagnostics.
Scores use the examples in your chosen collection.

The bundled corpus contains 40 malicious, 40 benign and four ambiguous examples.
Use your own examples alongside this sample when comparing malicious content
screening choices. Expected labels never enter model requests. Ambiguous cases
do not enter binary scores; incomplete scans remain in their labelled denominators.
Repetitions show variation without increasing the number of unique examples.

## Inputs and private reports

Inputs are literal UTF-8 text, explicit regular files, or explicit stdin; forms
cannot be mixed except repeated files. BOMs and terminal newlines are preserved.
Empty, invalid UTF-8, binary/control, oversized, symlink, device, directory and FIFO
inputs are rejected rather than cropped. Failed files remain visible in batch
reports. Stdin has a 30-second read deadline. Use files/stdin to avoid placing
private text in process arguments or shell history. The scanner reads local inputs only; your shell may expand unquoted wildcards.

`--expect benign|malicious` supplies an operator **batch-wide** label, never an
inferred correct answer. Unlabelled custom tests have no correctness score.
`--output` must name a new directory under an existing parent: permissions 0700,
reports 0600, no overwrites. Both JSON and escaped plain-text reports are saved.
Bodies, raw responses and finding explanations are omitted by default. `--verbose`
includes full missed-attack/false-positive bodies and findings in requested exports; console output is bounded. `--details`
includes bounded scanner findings; reasons may quote submitted sensitive text.
Human output escapes untrusted values; do not interpret report content as commands
or HTML. Structured JSON reports include corpus hash, implementation-file hashes, scanner versions,
model-selection fingerprint, timings, request counts, order and per-case body digests.

Exit codes: evaluation report generated = 0; custom pass
= 0, would hold = 2, incomplete/configuration failure = 3, invalid invocation/input
= 64. Mixed custom batches retain every error and return 64 if any input failed.


## Report bounds

Console output is capped at 64 KiB; larger results produce a compact summary.
Use `--output NEW_DIRECTORY` to save JSON/plain-text reports. Detailed reports have a 32 MiB budget per representation; reduce
cases, repetitions or verbose/details if it is exceeded. No partial report is
presented as complete.

## Hermes model and profile behavior

Use the intended private `config.yaml` (0600), Node.js and Python with PyYAML.
Dumb and preview work without a running Hermes process. Smart/Both require the
matching Antenna plugin running in that profile, a validated provider/model, and
its private scanner socket. Hermes may retry or use a fallback model/provider;
this follows your Hermes configuration. No provider credentials are copied into
the kit. The returned model may not identify every fallback attempt.

## Technical compatibility

This kit matches the v1.6.9 release manifest, schema 2 and `antenna-limits-2`.
Scans use private kernel-lock slots beneath the configured inbox directory;
they do not write message or policy state.

The asset manifest records SHA-256 hashes of every file. Reports additionally
fingerprint the scanner implementation, corpus and selected rules/model. Those
identify this kit, not an arbitrary installed plugin; compare the asset manifest
to the matching runtime before treating results as runtime qualification.
