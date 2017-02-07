#Google Cloud Documentation
This documentation will get you up and running quickly with google cloud

##Configuration
You should set the following configuration options before proceeding
```
gcloud auth application-default login
gcloud config configurations create <YourProjectName> --activate
gcloud config set account <YourGoogleAccount>
gcloud config set project <YourProjectName>
gcloud config set compute/zone us-central1-a
gcloud config set container/cluster <ClusterName>
//Anything else available here: https://cloud.google.com/sdk/gcloud/reference/config/set

``` 

##QuickStart
Use NPM script to build the docker container, upload the docker image to your gcloud, create a gcloud cluster, attach the image to the cluster, and expose the cluster.
```
npm run gcloud:quickstart
```
```

##HTTPS

##Finalize
Run the following command to get the external IP address that was assigned to the cluster.  The IP will take a couple minutes to appear.
```
kubectl get services
```

Open a browser and navigate to the External IP and you should see a welcome message