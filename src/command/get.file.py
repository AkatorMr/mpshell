import sys
import ubinascii

with open('{0}', 'rb') as infile:
    while True:
        result = infile.read({1})
        if result == b'':
            break
        len = sys.stdout.write(ubinascii.hexlify(result))