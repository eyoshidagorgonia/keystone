# Step 1: Build the Docker image from the specified GitHub repository.
docker build --no-cache --build-arg GIT_REPO_URL="https://github.com/eyoshidagorgonia/keystone.git" --build-arg GIT_BRANCH="master" -t keystone-app .

# Step 2: Check if the build command was successful.
# In PowerShell, `$?` is an automatic variable that contains the execution status of the last operation.
# It's $True if the command succeeded and $False if it failed.
if ($?) {
    Write-Host "Build successful. Proceeding to redeploy container..."

    # Step 3: Stop and remove the existing container. The -f flag forces removal if it's running.
    docker rm -f keystone_api_proxy

    # Step 4: Run the new container from the newly built image.
    docker run -d --name keystone_api_proxy -p 9003:9003 -e KEYSTONE_MODE=api keystone-app

    if ($?) {
        Write-Host "Container 'keystone_api_proxy' started successfully."
    } else {
        Write-Host "Error: Failed to start the new container."
    }
} else {
    Write-Host "Error: Docker build failed. Aborting deployment."
}
