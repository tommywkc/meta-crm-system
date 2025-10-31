#!/bin/bash
az webapp config appsettings set \
  --resource-group meta-crm-rg-test-v1 \
  --name meta-crn-app-test-v1 \
  --settings DATABASE_URL="postgresql://dbadmin:MetaCRM2024!@meta-crm-db-test-v1.postgres.database.azure.com:5432/postgres?sslmode=require"
