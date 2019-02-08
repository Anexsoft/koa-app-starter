# koa-app-starter
CLI to start a nodejs web api or application

## Intro
This CLI will serve as a starting point to create a new web api or application based on Koa (https://koajs.com).

**Why Koa?**
Because it is a middleware based on async/await pattern which is much easier to maintain and understand than Express (or so they say :))

**Why this CLI?**
Because I need to create many APIs and I want them to share a single base design, dependencies, and configurations. However, doing it while creating a node package is not the best solution because customizing to the needs of a specific API would be very hard and not future-proof.

By providing a CLI to do so, we can have a shared base which we can adapt and yet update it in the future very easily, as long as the pattern is followed.

## Opinionated
This is definitely an opinionated starter based on my own experience and what I'm continuously learning about NodeJs.

## Feedback
All feedback and contributions are welcome
