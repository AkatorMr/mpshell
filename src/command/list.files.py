import os
import sys
import ubinascii

def listdir(directory):
    result = set()
    def _listdir(dir_or_file):
        try:
            children = os.listdir(dir_or_file)
        except OSError:
            os.stat(dir_or_file)
            result.add(dir_or_file) 
        else:
            if children:
                for child in children:
                    if dir_or_file == '/':
                        next = dir_or_file + child
                    else:
                        next = dir_or_file + '/' + child
                    _listdir(next)
            else:
                result.add(dir_or_file)                     
    _listdir(directory)
    return sorted(result)
#print(listdir('/'))
fileListCompleta=''
for fileName in listdir('/'):
    if fileListCompleta=='':
        fileListCompleta=fileName+" "+os.stat(fileName)[6]
    else:
        fileListCompleta=fileListCompleta+','+fileName+" "+os.stat(fileName)[6]
sys.stdout.write(ubinascii.hexlify(fileListCompleta))