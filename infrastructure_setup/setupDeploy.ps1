$resourceGroupName = "SignUp-Rg"
$location = "East US"
$templateVnetSetup = "infrastructure.json"
$templateVnetParameters = "infrastructure.parameters.json"

# Azure Account Connection
Connect-AzAccount

# Createing Resource Group with the specified name and location
New-AzResourceGroup -Name $resourceGroupName -Location $location

# Deploying Vnet, Subnet, NSG, storage account, service bus, SQL server/database, App service plan, web app, logic app
New-AzResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateFile $templateVnetSetup -TemplateParameterFile $templateVnetParameters

# Set the storage account context
$storageAccountName = "signupazvmstg"
$storageAccountNameContainer = "templates"
$storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName
$ctx = $storageAccount.Context

# File to upload
$templateVMSetup = "vm.json"

# Upload the file to the blob container
Set-AzStorageBlobContent -File $templateVMSetup -Container $storageAccountNameContainer -Blob $blobName -Context $ctx -Force


################################### FOR TESTING PURPOSES ONLY ########################################################
# TEST VM DEPLOYMENT
New-AzResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateFile $templateVMSetup

# TEST STORAGE ACCOUNT DEPLOYMENT
New-AzResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateFile $templateStorageAccountSetup
##################################################################################################################






