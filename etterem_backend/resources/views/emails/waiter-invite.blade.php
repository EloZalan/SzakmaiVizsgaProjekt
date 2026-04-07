<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <title>Pincéri meghívó</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <p>Szia {{ $user->name }}!</p>

    <p>
        Meghívást kaptál a Grill House rendszerébe pincérként.
        Az alábbi linken tudod aktiválni a fiókodat és beállítani a jelszavadat:
    </p>

    <p>
        <a href="{{ $inviteUrl }}">Fiók aktiválása</a>
    </p>

    <p>Ha a link nem kattintható, másold be ezt a böngészőbe:</p>
    <p>{{ $inviteUrl }}</p>

    <p>A meghívó {{ optional($user->invite_expires_at)->format('Y-m-d H:i') }} időpontig érvényes.</p>

    <p>Udv,<br>Grill House</p>
</body>
</html>
