<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Etterem API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            background: #0d1117;
        }

        #swagger-ui {
            height: 100%;
        }

        .swagger-ui .topbar {
            background: #111827;
            border-bottom: 1px solid #374151;
        }
    </style>
</head>
<body>
<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
<script>
    window.addEventListener('load', function () {
        window.ui = SwaggerUIBundle({
            url: '{{ url('/docs/openapi.yaml') }}',
            dom_id: '#swagger-ui',
            deepLinking: true,
            docExpansion: 'list',
            persistAuthorization: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            layout: 'StandaloneLayout'
        });
    });
</script>
</body>
</html>
