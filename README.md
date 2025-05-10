# 📺 Shows Tracker

Shows Tracker is a _Personal App_, powered by [Aerogel](https://aerogel.js.org) and the [Solid Protocol](https://solidproject.org).

## What is a "Personal App"?

A Personal App is something I've made for myself, and I don't expect anyone else to use. You are welcome to look at the code though, and even use the app yourself, but keep in mind that it comes with no guarantees (even less than usual with Open Source).

Because of that, I don't even have issues enabled in this repository. But you are welcome to open discussions, and feel free to ping me if you have any questions.

Something else that distinguishes this from a "real" app is my attention to detail. I'm a lot more lenient here, and I don't pay much attention to things like accessibility (which I would otherwise). In fact, I rely heavily on AI for the UI. I guess you could say I am "Vibe Coding".

## Wait a second, did you say "Vibe Coding"? How much did the AI write?

I don't care about the exact percentage, but I would say most of the UI was written by AI. I recently talked about this in a presentation called [Solid Unleashed](https://noeldemartin.com/solid-symposium-2025), but TLDR:

- In order to reduce hallucinations, and get interoperability out of the box, most of the data is handled by Aerogel and [Soukai](https://soukai.js.org). I write most of it by hand, so there is very little AI involved.
- The UI is a different story, that's where I'm mostly "Vibe coding" and I rarely look at the code in depth. This is where AI shines, and what allows me to build these apps so quickly. I do look at every line of code before committing, but just to make sure that nothing problematic sneaked in.
- Finally, I have many guardrails in place to make sure that the code quality is somewhat decent and there aren't any regressions. For example, I have the same CI pipeline from all my other apps, and I make sure to write unit and E2E tests for important functionality. And yes, AI also writes a good chunk of those tests.
- If you're curious about the tooling, I'm using Cursor with Claude 3.7 Sonnet. I'm not using [Cursor rules](https://docs.cursor.com/context/rules) or anything else at the moment, but I'll probably explore other options in the future.

## This looks cool, why don't you make a "real" app?

I already did, it's called [Media Kraken](https://github.com/NoelDeMartin/media-kraken). At some point, I intend to implement this functionality there as well. But for now, this will have to do.
