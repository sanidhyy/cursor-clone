<a name="readme-top"></a>

# AI-powered code editor built with Next.js 16

![AI-powered code editor built with Next.js 16](/.github/images/img_main.png 'AI-powered code editor built with Next.js 16')

[![Ask Me Anything!](https://flat.badgen.net/static/Ask%20me/anything?icon=github&color=black&scale=1.01)](https://github.com/sanidhyy 'Ask Me Anything!')
[![GitHub license](https://flat.badgen.net/github/license/sanidhyy/cursor-clone?icon=github&color=black&scale=1.01)](https://github.com/sanidhyy/cursor-clone/blob/main/LICENSE 'GitHub license')
[![Maintenance](https://flat.badgen.net/static/Maintained/yes?icon=github&color=black&scale=1.01)](https://github.com/sanidhyy/cursor-clone/commits/main 'Maintenance')
[![GitHub branches](https://flat.badgen.net/github/branches/sanidhyy/cursor-clone?icon=github&color=black&scale=1.01)](https://github.com/sanidhyy/cursor-clone/branches 'GitHub branches')
[![Github commits](https://flat.badgen.net/github/commits/sanidhyy/cursor-clone?icon=github&color=black&scale=1.01)](https://github.com/sanidhyy/cursor-clone/commits 'Github commits')
[![GitHub issues](https://flat.badgen.net/github/issues/sanidhyy/cursor-clone?icon=github&color=black&scale=1.01)](https://github.com/sanidhyy/cursor-clone/issues 'GitHub issues')
[![GitHub pull requests](https://flat.badgen.net/github/prs/sanidhyy/cursor-clone?icon=github&color=black&scale=1.01)](https://github.com/sanidhyy/cursor-clone/pulls 'GitHub pull requests')
[![Vercel status](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://aipolaris.vercel.app 'Vercel status')

<!-- Table of Contents -->
<details>

<summary>

# :notebook_with_decorative_cover: Table of Contents

</summary>

- [Folder Structure](#bangbang-folder-structure)
- [Getting Started](#toolbox-getting-started)
- [Screenshots](#camera-screenshots)
- [Tech Stack](#gear-tech-stack)
- [Stats](#wrench-stats)
- [Contribute](#raised_hands-contribute)
- [Acknowledgements](#gem-acknowledgements)
- [Buy Me a Coffee](#coffee-buy-me-a-coffee)
- [Follow Me](#rocket-follow-me)
- [Learn More](#books-learn-more)
- [Deploy on Vercel](#page_with_curl-deploy-on-vercel)
- [Give A Star](#star-give-a-star)
- [Star History](#star2-star-history)
- [Give A Star](#star-give-a-star)

</details>

## :bangbang: Folder Structure

Here is the folder structure of this app.

<!--- FOLDER_STRUCTURE_START --->
```bash
cursor-clone/
  |- convex/
    |-- _generated/
    |-- auth.config.ts
    |-- auth.ts
    |-- conversations.ts
    |-- files.ts
    |-- projects.ts
    |-- schema.ts
    |-- settings.ts
    |-- system.ts
    |-- validators.ts
  |- public/
  |- src/
    |-- app/
      |--- (auth)/
      |--- (main)/
      |--- api/
      |--- apple-icon.png
      |--- favicon.ico
      |--- global-error.tsx
      |--- globals.css
      |--- icon0.svg
      |--- icon1.png
      |--- layout.tsx
      |--- manifest.json
      |--- not-found.tsx
    |-- components/
      |--- ai-elements/
      |--- providers/
      |--- ui/
      |--- connection-status.tsx
      |--- delete-confirmation-dialog.tsx
      |--- error-boundary.tsx
      |--- loading-state.tsx
    |-- config/
      |--- index.ts
    |-- constants/
      |--- http-status-codes.ts
      |--- prompts.ts
    |-- env/
      |--- client.ts
      |--- server.ts
    |-- features/
      |--- auth/
      |--- conversations/
      |--- editor/
      |--- preview/
      |--- projects/
      |--- settings/
    |-- hooks/
      |--- use-async-action.ts
    |-- inngest/
      |--- client.ts
    |-- lib/
      |--- convex-client.ts
      |--- encryption.ts
      |--- errors.ts
      |--- firecrawl.ts
      |--- utils.ts
    |-- schemas/
      |--- common.ts
    |-- proxy.ts
  |- .env.example
  |- .env/.env.local
  |- .gitignore
  |- .prettierignore
  |- components.json
  |- convex.json
  |- eslint.config.mjs
  |- next.config.ts
  |- package.json
  |- pnpm-lock.yaml
  |- pnpm-workspace.yaml
  |- postcss.config.mjs
  |- prettier.config.mjs
  |- tsconfig.json
  |- vercel.ts
```
<!--- FOLDER_STRUCTURE_END --->

<br />

## :toolbox: Getting Started

1. Make sure **Git**, **Node.js**, and **pnpm** are installed.
2. Clone this repository to your local computer.

   ```bash
   git clone https://github.com/sanidhyy/cursor-clone.git
   cd cursor-clone
   ```

3. Create `.env.local` in the **root** directory.
4. Contents of `.env.local`:

```env
# disable telemetry (optional)
DO_NOT_TRACK="1"
NEXT_TELEMETRY_DISABLED="1"
NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED="1"

# clerk api keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CLERK_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# clerk redirect urls
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"

# convex deployment (dev only)
CONVEX_DEPLOYMENT="dev:<project-id>" # team: <team-name>, project: <project-slug>

# convex urls
NEXT_PUBLIC_CONVEX_URL="https://<project-id>.convex.cloud"
NEXT_PUBLIC_CONVEX_SITE_URL="https://<project-id>.convex.site"

# convex internal key (generated by `openssl rand -hex 32`)
POLARIS_CONVEX_INTERNAL_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# verification secret and cron secret (generated by `openssl rand -hex 32`)
VERIFICATION_SECRET="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CRON_SECRET="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# firecrawl api key
FIRECRAWL_API_KEY="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 5. Disable Telemetry (Optional)

```bash
DO_NOT_TRACK=1
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED=1
```

- These disable telemetry from supported packages, including Next.js and Clerk.

---

### 6. Convex (Database)

- Sign up at [Convex](https://www.convex.dev/) and create a project.
- After installing project dependencies, run `pnpm run dev:convex` and follow the prompts to connect the project.
- Update the Convex values in `.env.local` with your deployment details.
- In your Convex deployment's environment variables, set `CLERK_FRONTEND_API_URL` to your Clerk Frontend API URL.
- Set `POLARIS_CONVEX_INTERNAL_KEY` in the Convex deployment to the same value used in `.env.local`.

---

### 7. Convex URLs

```env
CONVEX_DEPLOYMENT="dev:<project-id>"
NEXT_PUBLIC_CONVEX_URL="https://<project-id>.convex.cloud"
NEXT_PUBLIC_CONVEX_SITE_URL="https://<project-id>.convex.site"
```

- Replace these placeholders with the values for your Convex development deployment.
- Use your production deployment URLs when deploying the app.

---

### 8. Clerk (Authentication)

- Go to [Clerk Dashboard](https://dashboard.clerk.com/) and create a new application.
- Copy the **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Copy the **Secret Key** → `CLERK_SECRET_KEY`.
- Create a JWT template named `convex` using the Convex template, with the audience set to `convex`, matching `convex/auth.config.ts`.
- Use your Clerk Frontend API URL for `CLERK_FRONTEND_API_URL` in Convex.
- Keep the redirect URLs as provided unless you modify the authentication routes.
- Configure Clerk billing plans with the `pro` slug and GitHub account connections if you want to use the corresponding subscription and repository features.

### 9. Firecrawl and AI Settings

- Go to [Firecrawl](https://www.firecrawl.dev/) and create an API key.
- Copy the API key → `FIRECRAWL_API_KEY` for the agent's URL scraping tool.
- Once the app is running, sign in and add your OpenAI API key through **AI Settings** to enable AI features.

### 10. Generate Secrets

- Run the following command separately for each secret:

  ```bash
  openssl rand -hex 32
  ```

- Copy the outputs → `POLARIS_CONVEX_INTERNAL_KEY`, `VERIFICATION_SECRET`, and `CRON_SECRET`.
- Use the same `POLARIS_CONVEX_INTERNAL_KEY` in both `.env.local` and the Convex deployment's environment variables.

---

11. Install project dependencies using `pnpm install`. Complete the Convex setup in step 6 before starting the app.

12. Start the app using `pnpm run dev` and open [http://localhost:3000](http://localhost:3000).

**NOTE:** Please make sure to keep your API keys and configuration values secure and do not expose them publicly.

### :raising_hand: Need Help?

If you run into issues during installation or setup:

- **GitHub Discussions** — [Open a Q&A discussion](https://github.com/sanidhyy/cursor-clone/discussions/new?category=q-a) for setup and troubleshooting help.
- **Email** — [sanidhyyy@gmail.com](mailto:sanidhyyy@gmail.com)
- **Discord** — `@sanidhyy`

## :camera: Screenshots

![AI assistant, code editor, and live preview](/.github/images/img1.png 'AI assistant, code editor, and live preview')

![Modern UI/UX](/.github/images/img2.png 'Modern UI/UX')

## :gear: Tech Stack

[![React JS](https://skillicons.dev/icons?i=react 'React JS')](https://react.dev/ 'React JS') [![Next JS](https://skillicons.dev/icons?i=next 'Next JS')](https://nextjs.org/ 'Next JS') [![Typescript](https://skillicons.dev/icons?i=ts 'Typescript')](https://www.typescriptlang.org/ 'Typescript') [![Tailwind CSS](https://skillicons.dev/icons?i=tailwind 'Tailwind CSS')](https://tailwindcss.com/ 'Tailwind CSS') [![Vercel](https://skillicons.dev/icons?i=vercel 'Vercel')](https://vercel.com/ 'Vercel')

## :wrench: Stats

[![Stats for Polaris](/.github/images/stats.svg 'Stats for Polaris')](https://pagespeed.web.dev/analysis?url=https://aipolaris.vercel.app 'Stats for Polaris')

## :raised_hands: Contribute

You might encounter some bugs while using this app. You are more than welcome to contribute. Just submit changes via pull request and I will review them before merging. Make sure you follow the [contribution guidelines](CONTRIBUTING.md) and [code of conduct](CODE_OF_CONDUCT.md).

## :gem: Acknowledgements

Useful resources and dependencies that are used in Polaris.

- Thanks to CodeWithAntonio: https://codewithantonio.com/

<!--- DEPENDENCIES_START --->
- [@ai-sdk/openai](https://www.npmjs.com/package/@ai-sdk/openai): ^4.0.111
- [@base-ui/react](https://www.npmjs.com/package/@base-ui/react): ^1.9.0
- [@clerk/nextjs](https://www.npmjs.com/package/@clerk/nextjs): ^7.9.25
- [@codemirror/autocomplete](https://www.npmjs.com/package/@codemirror/autocomplete): ^6.20.4
- [@codemirror/commands](https://www.npmjs.com/package/@codemirror/commands): ^6.11.1
- [@codemirror/lang-css](https://www.npmjs.com/package/@codemirror/lang-css): ^6.3.1
- [@codemirror/lang-html](https://www.npmjs.com/package/@codemirror/lang-html): ^6.4.12
- [@codemirror/lang-javascript](https://www.npmjs.com/package/@codemirror/lang-javascript): ^6.2.5
- [@codemirror/lang-json](https://www.npmjs.com/package/@codemirror/lang-json): ^6.0.2
- [@codemirror/lang-markdown](https://www.npmjs.com/package/@codemirror/lang-markdown): ^6.5.2
- [@codemirror/lang-python](https://www.npmjs.com/package/@codemirror/lang-python): ^6.2.1
- [@codemirror/language](https://www.npmjs.com/package/@codemirror/language): ^6.13.1
- [@codemirror/lint](https://www.npmjs.com/package/@codemirror/lint): ^6.9.7
- [@codemirror/search](https://www.npmjs.com/package/@codemirror/search): ^6.7.2
- [@codemirror/state](https://www.npmjs.com/package/@codemirror/state): ^6.7.6
- [@codemirror/theme-one-dark](https://www.npmjs.com/package/@codemirror/theme-one-dark): ^6.1.3
- [@codemirror/view](https://www.npmjs.com/package/@codemirror/view): ^6.43.15
- [@ianvs/prettier-plugin-sort-imports](https://www.npmjs.com/package/@ianvs/prettier-plugin-sort-imports): ^4.7.1
- [@inngest/agent-kit](https://www.npmjs.com/package/@inngest/agent-kit): ^0.13.2
- [@react-symbols/icons](https://www.npmjs.com/package/@react-symbols/icons): ^1.4.1
- [@replit/codemirror-indentation-markers](https://www.npmjs.com/package/@replit/codemirror-indentation-markers): ^6.5.3
- [@replit/codemirror-minimap](https://www.npmjs.com/package/@replit/codemirror-minimap): ^0.5.2
- [@streamdown/cjk](https://www.npmjs.com/package/@streamdown/cjk): ^1.0.4
- [@streamdown/code](https://www.npmjs.com/package/@streamdown/code): ^2.0.0
- [@streamdown/math](https://www.npmjs.com/package/@streamdown/math): ^1.0.3
- [@streamdown/mermaid](https://www.npmjs.com/package/@streamdown/mermaid): ^1.0.3
- [@t3-oss/env-nextjs](https://www.npmjs.com/package/@t3-oss/env-nextjs): ^0.13.11
- [@tailwindcss/postcss](https://www.npmjs.com/package/@tailwindcss/postcss): ^4.3.5
- [@tanstack/react-form](https://www.npmjs.com/package/@tanstack/react-form): ^1.33.5
- [@types/node](https://www.npmjs.com/package/@types/node): ^26.6.6
- [@types/react](https://www.npmjs.com/package/@types/react): ^19
- [@types/react-dom](https://www.npmjs.com/package/@types/react-dom): ^19
- [@vercel/config](https://www.npmjs.com/package/@vercel/config): ^0.14.1
- [@webcontainer/api](https://www.npmjs.com/package/@webcontainer/api): ^1.6.4
- [@xterm/addon-fit](https://www.npmjs.com/package/@xterm/addon-fit): ^0.11.0
- [@xterm/xterm](https://www.npmjs.com/package/@xterm/xterm): ^6.0.0
- [ai](https://www.npmjs.com/package/ai): ^7.0.165
- [allotment](https://www.npmjs.com/package/allotment): ^1.20.6
- [class-variance-authority](https://www.npmjs.com/package/class-variance-authority): ^0.7.1
- [cmdk](https://www.npmjs.com/package/cmdk): ^1.1.1
- [cn](https://www.npmjs.com/package/cn): ^0.5.2
- [codemirror](https://www.npmjs.com/package/codemirror): ^6.0.2
- [convex](https://www.npmjs.com/package/convex): ^1.49.0
- [date-fns](https://www.npmjs.com/package/date-fns): ^4.4.0
- [eslint](https://www.npmjs.com/package/eslint): ^10.14.0
- [eslint-config-next](https://www.npmjs.com/package/eslint-config-next): 16.4.5
- [eslint-config-prettier](https://www.npmjs.com/package/eslint-config-prettier): ^10.1.8
- [eslint-plugin-tailwindcss](https://www.npmjs.com/package/eslint-plugin-tailwindcss): ^4.4.0
- [firecrawl](https://www.npmjs.com/package/firecrawl): ^4.52.0
- [inngest](https://www.npmjs.com/package/inngest): ^4.26.2
- [inngest-cli](https://www.npmjs.com/package/inngest-cli): ^1.51.0
- [isbinaryfile](https://www.npmjs.com/package/isbinaryfile): ^6.0.0
- [ky](https://www.npmjs.com/package/ky): ^2.2.0
- [lucide-react](https://www.npmjs.com/package/lucide-react): ^1.70.0
- [mprocs](https://www.npmjs.com/package/mprocs): ^0.9.6
- [nanoid](https://www.npmjs.com/package/nanoid): ^6.0.2
- [next](https://www.npmjs.com/package/next): 16.4.5
- [next-themes](https://www.npmjs.com/package/next-themes): ^0.4.6
- [octokit](https://www.npmjs.com/package/octokit): ^5.0.5
- [prettier](https://www.npmjs.com/package/prettier): ^3.9.10
- [prettier-plugin-tailwindcss](https://www.npmjs.com/package/prettier-plugin-tailwindcss): ^0.8.1
- [react](https://www.npmjs.com/package/react): 19.3.1
- [react-dom](https://www.npmjs.com/package/react-dom): 19.3.1
- [react-icons](https://www.npmjs.com/package/react-icons): ^5.7.0
- [sonner](https://www.npmjs.com/package/sonner): ^2.0.8
- [streamdown](https://www.npmjs.com/package/streamdown): ^2.7.1
- [tailwindcss](https://www.npmjs.com/package/tailwindcss): ^4.3.5
- [tw-animate-css](https://www.npmjs.com/package/tw-animate-css): ^1.4.0
- [typescript](https://www.npmjs.com/package/typescript): ^6.0.3
- [unique-names-generator](https://www.npmjs.com/package/unique-names-generator): ^4.7.1
- [use-stick-to-bottom](https://www.npmjs.com/package/use-stick-to-bottom): ^1.1.6
- [zod](https://www.npmjs.com/package/zod): ^4.6.7
- [zustand](https://www.npmjs.com/package/zustand): ^5.1.0

<!--- DEPENDENCIES_END --->

## :coffee: Buy Me a Coffee

[<img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" width="200" />](https://www.buymeacoffee.com/sanidhy 'Buy me a Coffee')

## :rocket: Follow Me

[![Follow Me](https://img.shields.io/github/followers/sanidhyy?style=social&label=Follow&maxAge=2592000)](https://github.com/sanidhyy 'Follow Me')
[![Tweet about this project](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fx.com%2F_sanidhyy)](https://x.com/intent/tweet?text=Check+out+this+amazing+app:&url=https%3A%2F%2Fgithub.com%2Fsanidhyy%2Fcursor-clone 'Tweet about this project')

## :books: Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## :page_with_curl: Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Add the production environment variables from `.env.example` in Vercel, along with `CONVEX_DEPLOY_KEY`, `INNGEST_EVENT_KEY`, and `INNGEST_SIGNING_KEY`. Configure `CLERK_FRONTEND_API_URL` and the matching `POLARIS_CONVEX_INTERNAL_KEY` in your production Convex deployment. Connect the deployed `/api/inngest` endpoint to your Inngest app.

The build command in `vercel.ts` deploys Convex before building Next.js, and the configured cron removes expired AI settings.

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## :star: Give A Star

You can also give this repository a star to show more people and they can use this repository.

## :star2: Star History

<a href="https://star-history.com/#sanidhyy/cursor-clone&Timeline">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=sanidhyy/cursor-clone&type=Timeline&theme=dark" />
  <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=sanidhyy/cursor-clone&type=Timeline" />
  <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=sanidhyy/cursor-clone&type=Timeline" />
</picture>
</a>

<br />
<p align="right">(<a href="#readme-top">back to top</a>)</p>
