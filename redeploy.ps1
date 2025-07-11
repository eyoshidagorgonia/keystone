# This script rebuilds and redeploys the Keystone API container.
# It ensures the image is tagged and run with a consistent name.

# Define the image and container name
$imageName = "keystone-app"
$containerName = "keystone_api_proxy" # Matches docker-compose.yml
$repoUrl = "https://github.com/eyoshidagorgonia/keystone.git#master"

# Build the Docker image from the latest master branch
docker build --no-cache -t $imageName $repoUrl

# Check if the build was successful before proceeding
if ($?) {
    Write-Host "Build successful. Redeploying container..."
    
    # Stop and remove the existing container if it exists
    if ($(docker ps -a -q -f name=$containerName)) {
        docker rm -f $containerName
    }
    
    # Run the new container from the newly built image
    docker run -d --name $containerName -p 9003:9003 -e KEYSTONE_MODE=api $imageName
    
    Write-Host "Container '$containerName' has been started."
} else {
    Write-Host "Docker build failed. Deployment aborted."
}
