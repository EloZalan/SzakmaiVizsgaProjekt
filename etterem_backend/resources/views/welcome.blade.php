<!DOCTYPE html>
<html lang="hu">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Grill House Backend</title>
	<style>
		:root {
			--bg-1: #f4efe6;
			--bg-2: #e6ddd0;
			--card: #fffaf2;
			--text: #2f2419;
			--muted: #6d5b49;
			--primary: #b24b2a;
			--primary-dark: #8f3a20;
			--border: #e3d4c2;
		}

		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			min-height: 100vh;
			font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
			color: var(--text);
			background:
				radial-gradient(circle at 10% 15%, rgba(178, 75, 42, 0.18), transparent 35%),
				radial-gradient(circle at 90% 80%, rgba(143, 58, 32, 0.14), transparent 40%),
				linear-gradient(135deg, var(--bg-1), var(--bg-2));
			display: grid;
			place-items: center;
			padding: 24px;
		}

		.wrapper {
			width: min(860px, 100%);
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 20px;
			box-shadow: 0 18px 40px rgba(61, 33, 16, 0.14);
			overflow: hidden;
		}

		.hero {
			padding: 36px 28px 20px;
			border-bottom: 1px solid var(--border);
			background: linear-gradient(180deg, rgba(255, 250, 242, 0.98), rgba(255, 245, 233, 0.82));
		}

		.badge {
			display: inline-block;
			font-size: 12px;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			font-weight: 700;
			color: var(--primary-dark);
			background: #f8e4d6;
			border: 1px solid #f1c7ad;
			border-radius: 999px;
			padding: 7px 12px;
			margin-bottom: 14px;
		}

		h1 {
			margin: 0;
			font-size: clamp(1.8rem, 2.8vw, 2.5rem);
			line-height: 1.18;
		}

		.lead {
			margin: 14px 0 0;
			font-size: 1rem;
			color: var(--muted);
			line-height: 1.6;
		}

		.content {
			padding: 24px 28px 30px;
			display: grid;
			gap: 16px;
		}

		.item {
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 16px;
			background: #fffcf7;
		}

		.item h2 {
			margin: 0;
			font-size: 1.06rem;
		}

		.item p {
			margin: 10px 0 14px;
			color: var(--muted);
			line-height: 1.5;
		}

		.actions {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
		}

		.btn {
			display: inline-block;
			text-decoration: none;
			font-weight: 700;
			font-size: 0.94rem;
			border-radius: 10px;
			padding: 10px 14px;
			border: 1px solid transparent;
			transition: 0.15s ease;
		}

		.btn-primary {
			color: #fff;
			background: var(--primary);
		}

		.btn-primary:hover {
			background: var(--primary-dark);
		}

		.btn-ghost {
			color: var(--primary-dark);
			border-color: #d9baa4;
			background: #fff4ea;
		}

		.btn-ghost:hover {
			background: #fbe9db;
		}

		code {
			background: #f8eee4;
			border: 1px solid #efdac8;
			border-radius: 7px;
			padding: 2px 6px;
			font-family: Consolas, Monaco, monospace;
			font-size: 0.9em;
		}
	</style>
</head>
<body>
	<main class="wrapper">
		<section class="hero">
			<span class="badge">Grill House API</span>
			<h1>Üdv a Grill House backend szolgáltatásában</h1>
			<p class="lead">
				Ez a Laravel API kezeli az étlapot, a foglalásokat, a rendeléselemeket és az admin műveleteket.
				A dokumentáció és a minta végpontok az alábbi gombokkal azonnal elérhetők.
			</p>
		</section>

		<section class="content">
			<article class="item">
				<h2>API dokumentáció</h2>
				<p>A Swagger felület a teljes API struktúrát, modelleket és végpontokat mutatja.</p>
				<div class="actions">
					<a class="btn btn-primary" href="{{ url('/docs') }}">Megnyitás: /docs</a>
				</div>
			</article>

			<article class="item">
				<h2>Példa végpont</h2>
				<p>Menüelemek listája JSON válasszal: <code>/menu-items</code>.</p>
				<div class="actions">
					<a class="btn btn-ghost" href="{{ url('/menu-items') }}">Megnyitás: /menu-items</a>
				</div>
			</article>
		</section>
	</main>
</body>
</html>
