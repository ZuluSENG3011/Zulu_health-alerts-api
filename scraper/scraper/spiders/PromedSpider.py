import scrapy

class PromedSpider(scrapy.Spider):
    name = "test"
    start_urls = ["https://www.promedmail.org/"]

    def parse(self, response):
        yield {
            "url": response.url,
            "html_content": response.text 
        }