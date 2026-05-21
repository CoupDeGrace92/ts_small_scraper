import { getHTML } from "./crawl.js"

async function main(){
    if (!process.argv.slice(2) || process.argv.slice(2).length !== 1){
        console.error("Incorrect number of args - expect just a url")
        process.exit(1)
    }
    const baseURL = process.argv.slice(2)[0]
    console.log(`Crawler starting at: ${baseURL}`)
    try{
        await getHTML(baseURL)
    } catch (err) {
        console.error(err)
    }
    process.exit(0)
}

main()