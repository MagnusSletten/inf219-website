from utils import refresh_composition_file
import os 

here = os.path.dirname(__file__)                   
static_folder = os.path.join(here, "static")       
n = refresh_composition_file(static_folder)