function main(){
    if (!process.argv.slice(2) || process.argv.slice(2).length !== 1){
        console.error("Incorrect number of args - expect just a url")
        process.exit(1)
    }

    console.log(`Crawler starting at: ${process.argv.slice(2)[0]}`)
    process.exit(0)
}

main()