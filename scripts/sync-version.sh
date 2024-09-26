packageJSON="./package.json"

if [ ! -f $packageJSON ]; then
    echo -e "\033[0;31mpackage.json not found at \"$packageJSON\"!"
    exit 1
fi

othentVersion=$(node -p "require('$packageJSON').dependencies['@othent/kms'].replace('^', '')")
originalOthentVersion=$othentVersion

if [[ $originalOthentVersion == link:* ]]; then
  echo -e "\033[0;32m✔\033[0m Reinstalling latest '@othent/kms' version..."
  pnpm install-othent
  othentVersion=$(node -p "require('$packageJSON').dependencies['@othent/kms'].replace('^', '')")
fi

if [ -z "$othentVersion" ]; then
    echo -e "\033[0;31mCould not read '@othent/kms' version!"
    exit 1
fi

echo -e "\033[0;32m✔\033[0m Updating package.json's version to '${othentVersion}'..."

sed -i -e "s/\"version\": \".*\"/\"version\": \"${othentVersion}\"/" ./package.json
# -i = in-place edit
# Note there's no g flag used in the regular expression to make sure only one line is affected (just in case).

git add ./package.json

if [[ $originalOthentVersion == link:* ]]; then
  echo -e "\033[0;32m✔\033[0m Restoring the linked '@othent/kms' previously in use..."
  pnpm link-othent
fi
