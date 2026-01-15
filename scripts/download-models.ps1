# PowerShell script to download face-api.js models
$models = @(
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1"
)

$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
$destPath = "public\models\"

if (!(Test-Path $destPath)) {
    New-Item -ItemType Directory -Force -Path $destPath
}

foreach ($model in $models) {
    echo "Downloading $model..."
    Invoke-WebRequest -Uri ($baseUrl + $model) -OutFile ($destPath + $model)
}

echo "All models downloaded to $destPath"
