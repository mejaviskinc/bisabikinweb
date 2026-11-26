import base64
import io
import unittest
from PIL import Image
from instagram_apply_studio_revision import prepare

def jpeg(color="red", size=(1080,1350)):
    b=io.BytesIO()
    Image.new("RGB",size,color).save(b,"JPEG")
    return base64.b64encode(b.getvalue()).decode()

class RevisionTest(unittest.TestCase):
    def setUp(self):
        self.old={"id":"test-queue-001","caption":"Original caption", "date":"2026-11-27","slot":"08:00","status":"approved","fact_checked":True,"rights_verified":True,"source_url":"https://example.com","rights_note":"Owned","image_url":"https://example.com/old.jpg"}
        self.queues={"quotes_300_queue.json":{"items":[self.old]}}
        self.data={"schema":1,"id":self.old["id"],"caption":self.old["caption"],"approved":True,"rights_confirmed":True,"jpeg_pages":[jpeg()]}
    def test_revise_existing(self):
        name, old, new, files=prepare(self.data,self.queues,{})
        self.assertEqual(name,"quotes_300_queue.json")
        for k in ("id","date","slot","source_url","rights_note","status"):
            self.assertEqual(new[k],old[k])
        self.assertIn("/rendered/studio/",new["image_url"])
        self.assertEqual(len(files),1)
        self.assertEqual(self.old["image_url"],"https://example.com/old.jpg")
    def test_claimed(self):
        with self.assertRaises(ValueError):
            prepare(self.data,self.queues,{self.old["id"]:{"status":"claimed"}})
    def test_published(self):
        with self.assertRaises(ValueError):
            prepare(self.data,self.queues,{self.old["id"]:{"status":"published"}})
    def test_carousel(self):
        self.data["jpeg_pages"].append(jpeg("blue"))
        _,_,new,files=prepare(self.data,self.queues,{})
        self.assertEqual(len(new["image_urls"]),2)
        self.assertNotIn("image_url",new)
        self.assertEqual(len(files),2)
    def test_duplicate_slide(self):
        self.data["jpeg_pages"]*=2
        with self.assertRaises(ValueError):
            prepare(self.data,self.queues,{})
    def test_bad_ratio(self):
        self.data["jpeg_pages"]=[jpeg(size=(1080,1920))]
        with self.assertRaises(ValueError):
            prepare(self.data,self.queues,{})
    def test_missing_approval(self):
        self.data["approved"]=False
        with self.assertRaises(ValueError):
            prepare(self.data,self.queues,{})
    def test_caption_confirmation(self):
        self.data["caption"]="Changed caption"
        with self.assertRaises(ValueError):
            prepare(self.data,self.queues,{})
    def test_missing_id(self):
        self.data["id"]="not-existing"
        with self.assertRaises(ValueError):
            prepare(self.data,self.queues,{})

if __name__=="__main__":
    unittest.main()
