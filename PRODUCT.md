# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner's household, glancing at Morning Desk on a screen at home in the morning. One person (the admin) sets it up and changes settings; everyone else only looks at it.

## Product Purpose

A glance at Morning Desk answers two questions for the day ahead:

1. **What is the weather doing today?** Current conditions and the 5-day outlook for the profile's location.
2. **What state is the home's power in?** Whether the house is running on solar, battery or grid right now, the power flowing on each path, and how long the battery will last at the current load.

Success is answering both at a glance, without anyone touching the screen.

## Operating Context

- Runs as a Docker container on a small, always-on box (typically a Proxmox LXC) and is viewed in a browser on the home network.
- Updates itself daily at 04:15, only to versions whose tests passed on GitHub.
- Profiles let one install serve several homes or screens, each with its own location, solar account and news selection.

## Capabilities and Constraints

- **Hardware:** must run well on cheap, always-on hardware, both the server and the screens that show it. Avoid work that costs CPU or GPU continuously (endless layout work, heavy effects, frequent polling).
- **Data sources:** solar readings from Growatt's OpenAPI (a Victron provider exists on a branch); weather from Open-Meteo; RSS news feeds and the Sky News YouTube stream.
- **Also on the dashboard (not a core job):** news headlines from chosen sources and Sky News live.
- **Secrets stay on the server:** API tokens are never sent to the browser; settings are protected by an admin password.
- **Undecided:** viewing distance and screen type are not fixed requirements; screens range from phones to wall-mounted tablets.

## Evidence on Hand

- Real configuration example: `config.example.json` (Erasmuskloof, Africa/Johannesburg, Growatt).
- No user research, screenshots of installs or usage data exist; do not invent them.

## Product Principles

1. **Weather and power first.** Anything else on the screen supports these two answers or stays out of their way.
2. **Glanceable without interaction.** The screen should be useful to someone who never touches it.
3. **Honest state.** Never show old data as current: say when something is offline, stale or unavailable.
4. **Light on hardware.** Every feature has to justify its running cost on low-power, always-on devices.
