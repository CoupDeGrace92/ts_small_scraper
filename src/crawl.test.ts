import { expect, test, describe } from "vitest"
import { 
    normalizeURL, 
    getHeadingFromHTML, 
    getFirstParagraphFromHTML,
    getURLsFromHTML,
    getImagesFromHTML,
    extractPageData,
} from "./crawl.js"

describe("normalizeURL tests", function (){
    test( "Basic ", () => {
        expect(normalizeURL("https://www.google.com")).toBe("www.google.com")
    })

    test( "Non-url errors", () => {
        expect(() => {
            normalizeURL("This is not a URL")
        }).toThrow()
    })

    test( "Two different protocols", () => {
        expect(normalizeURL("http://www.google.com")).toBe(normalizeURL("https://www.google.com"))
    })

    test( "Trailing / removed", () => {
        expect(normalizeURL("https://www.google.com/applesauce/")).toBe("www.google.com/applesauce")
    })
})

describe("getHeadingFromHTML tests", function() {
    test( "Base", () =>{
        const inputBody = `
        <html>
            <body>
                <h1>The Great Scraper</h1>
                <h2>A Secondary Title</h2>
                <p>This is a paragraph outside of main.</p>
                <main>
                <p>This is the important content inside the main tag.</p>
                </main>
            </body>
        </html>
        `
        expect(getHeadingFromHTML(inputBody)).toBe("The Great Scraper")
    })

    test( "No h1 but h2", () =>{
        const inputBody = `
        <html>
            <body>
                <h2>A Secondary Title</h2>
                <p>This is a paragraph outside of main.</p>
                <main>
                <p>This is the important content inside the main tag.</p>
                </main>
            </body>
        </html>
        `
        expect(getHeadingFromHTML(inputBody)).toBe("A Secondary Title")
    })

    test( "Neither h1 nor h2", () =>{
        const inputBody = `
        <html>
            <body>
                <p>This is a paragraph outside of main.</p>
                <main>
                <p>This is the important content inside the main tag.</p>
                </main>
            </body>
        </html>
        `
        expect(getHeadingFromHTML(inputBody)).toBe("")
    })

        test( "nonsense DOM", () =>{
        const inputBody = `YOU COWARD COME FIGHT ME IRL`
        expect(getHeadingFromHTML(inputBody)).toBe("")
    })
})

describe("getFirstParagraphFromHTML tests", function() {
    test("Base test", () => {
        const inputBody = `
        <html>
            <body>
                <h1>The Great Scraper</h1>
                <h2>A Secondary Title</h2>
                <p>This is a paragraph outside of main.</p>
                <main>
                <p>This is the important content inside the main tag.</p>
                </main>
            </body>
        </html>
        `
        expect(getFirstParagraphFromHTML(inputBody)).toBe("This is the important content inside the main tag.")
    })

    test("No Main", () => {
        const inputBody = `
        <html>
            <body>
                <h1>The Great Scraper</h1>
                <h2>A Secondary Title</h2>
                <p>This is a paragraph outside of main.</p>
            </body>
        </html>
        `
        expect(getFirstParagraphFromHTML(inputBody)).toBe("This is a paragraph outside of main.")
    })

    test("Multiple ps", () => {
        const inputBody = `
        <html>
            <body>
                <h1>The Great Scraper</h1>
                <h2>A Secondary Title</h2>
                <p>This is a paragraph outside of main.</p>
                <main>
                <p>This is the important content inside the main tag.</p>
                <p>More important content</p>
                </main>
            </body>
        </html>
        `
        expect(getFirstParagraphFromHTML(inputBody)).toBe("This is the important content inside the main tag.")
    })

    test("No p in main", () => {
        const inputBody = `
        <html>
            <body>
                <h1>The Great Scraper</h1>
                <h2>A Secondary Title</h2>
                <p>This is a paragraph outside of main.</p>
                <main>
                </main>
            </body>
        </html>
        `
        expect(getFirstParagraphFromHTML(inputBody)).toBe("This is a paragraph outside of main.")
    })

    test("No p", () => {
        const inputBody = `
        <html>
            <body>
                <h1>The Great Scraper</h1>
                <h2>A Secondary Title</h2>
                <main>
                </main>
            </body>
        </html>
        `
        expect(getFirstParagraphFromHTML(inputBody)).toBe("")
    })
})

describe("getURLsFromHTML tests", function() {
    test ("Base, multiple absolute paths", () => {
        const inputURL = "https://crawler-test.com"
        const inputBody = `
        <html>
            <body>
                <a href="/path/one"><span>Boot.dev</span></a>
                <a href="/path/two"><span>Boot.dev</span></a>
            </body>
        </html>
        `

        const actual = getURLsFromHTML(inputBody, inputURL)
        const expected = ["https://crawler-test.com/path/one", "https://crawler-test.com/path/two"]

        expect(actual).toEqual(expected)
    })

    test("relative path to absolute", () => {
        const inputURL = "https://crawler-test.com"
        const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`

        const actual = getURLsFromHTML(inputBody, inputURL)
        const expected = ["https://crawler-test.com/path/one"]

        expect(actual).toEqual(expected)
    })

    test("Single absolute path", () => {
        const inputURL = "https://crawler-test.com"
        const inputBody = `<html><body><a href="https://crawler-test.com/path/one"><span>Boot.dev</span></a></body></html>`
    
        const actual = getURLsFromHTML(inputBody, inputURL)
        const expected = ["https://crawler-test.com/path/one"]

        expect(actual).toEqual(expected)
    })
})

describe("getImagesFromHTML tests", function() {
    test ("Base, multiple absolute paths", () => {
        const inputURL = "https://crawler-test.com"
        const inputBody = `
        <html>
            <body>
                <img src="/logo1.png" alt="Logo1">
                <img src="/logo2.png" alt="Logo2">
            </body>
        </html>
        `

        const actual = getImagesFromHTML(inputBody, inputURL)
        const expected = ["https://crawler-test.com/logo1.png", "https://crawler-test.com/logo2.png"]

        expect(actual).toEqual(expected)
    })

    test("relative path to absolute", () => {
        const inputURL = "https://crawler-test.com"
        const inputBody = `<html><body><img src="/logo1.png" alt="Logo1"></body></html>`

        const actual = getImagesFromHTML(inputBody, inputURL)
        const expected = ["https://crawler-test.com/logo1.png"]

        expect(actual).toEqual(expected)
    })

    test("Single absolute path", () => {
        const inputURL = "https://crawler-test.com"
        const inputBody = `<html><body><img src="https://crawler-test.com/logo1.png" alt="Logo1"></body></html>`
    
        const actual = getImagesFromHTML(inputBody, inputURL)
        const expected = ["https://crawler-test.com/logo1.png"]

        expect(actual).toEqual(expected)
    })
})

describe("extractPageData tests", function() {
    test("Base", () => {
        const inputURL = "https://crawler-test.com"
        const inputBody = `
            <html><body>
                <h1>Test Title</h1>
                    <p>This is the first paragraph.</p>
                    <a href="/link1">Link 1</a>
                    <img src="/image1.jpg" alt="Image 1">
            </body></html>
        `
        const actual = extractPageData(inputBody, inputURL)
        const expected = {
            url: "https://crawler-test.com",
            heading: "Test Title",
            firstParagraph: "This is the first paragraph.",
            outgoingLinks: ["https://crawler-test.com/link1"],
            imageURLs: ["https://crawler-test.com/image1.jpg"],
        }

        expect(actual).toEqual(expected)
    })
})