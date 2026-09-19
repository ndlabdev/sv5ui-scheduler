# Security Policy

## Supported versions

Fixes are applied to the latest minor release.

| Version | Supported |
| ------- | --------- |
| 0.x     | Yes       |

## Reporting a vulnerability

**Please do not report a vulnerability through a public issue or pull request.**

Report it privately through the [Report a vulnerability](https://github.com/ndlabdev/sv5ui-scheduler/security/advisories/new) form, under the Security tab of this repository. The details stay private until a fix ships.

Please include:

- The version of the package and of `sv5ui`.
- What an attacker can do, and what it takes to trigger it.
- A minimal reproduction, and the `locale`, `timeZone` and `dir` in use when they matter.

## What to expect

- An acknowledgement within a few days.
- An assessment of severity and of the versions affected, with a disclosure timeline.
- Credit in the release notes once the fix ships, unless you would rather stay anonymous.

## Scope

The scheduler renders markup and computes dates. It never fetches, stores or authenticates anything: `source` and `onMutate` are functions the application provides and controls. The issues most likely to matter here are:

- **Unsafe rendering**, such as a value from an event reaching a dangerous sink instead of being escaped as text.
- **Prototype pollution or an unsafe merge** in the configuration and label merging that `defineSchedulerConfig` and `mergeLabels` perform.
- **A denial of service in the pure logic**, for example a recurrence rule or a range that makes expansion run without end.
- **Supply chain concerns** in the build and publish tooling.

Passing untrusted data into a snippet that renders it as HTML remains the responsibility of the application, consistent with how Svelte treats it. If a part of the scheduler creates a sink you did not expect, report it.
