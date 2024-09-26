packageJSON="./package.json"

if [ ! -f $packageJSON ]; then
    echo -e "\033[0;31mCoverage summary not found at \"$packageJSON\"!"
    exit 1
fi

othentVersion=$(node -p "require('$packageJSON').dependencies['@othent/kms'].replace('^', '')")

if [ -z "$othentVersion" ]; then
    echo -e "\033[0;31mCould not read `@othent/kms` version!"
    exit 1
fi

echo -e "\033[0;32m✔\033[0m Updating package.json's version to '${othentVersion}'..."

sed -i -e "s/\"version\": \".*\"/\"version\": \"${othentVersion}\"/" ./package.json
# -i = in-place edit
# Note there's no g flag used in the regular expression to make sure only one line is affected (just in case).

git add ./package.json
