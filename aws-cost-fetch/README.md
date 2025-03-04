# Description
Here I fetch the AWS billing information or cost information using the `AWS api`.
1. Authentication is done through SSO
2. IAM Permissions required
    ```
    {
    "Effect": "Allow",
    "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
    ],
    "Resource": "*"
    }
    ```