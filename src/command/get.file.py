import sys
import ubinascii
import time

def get_file(nombre):
    with open(nombre, 'rb') as infile:
        while True:
            result = infile.read({1})
            if result == b'':
                break
            len = sys.stdout.write(ubinascii.hexlify(result))
            while True:
                char = sys.stdin.read(1)
                if char>0:
                    if char == '\x0a': # espera para enviar mas datos
                        break
def get_file_n(nombre,part):
    with open(nombre, 'rb') as infile:
        paso=False
        while True:
            if part != 0:
                part-=1
                continue
            
            result = infile.read({1})
            if result == b'':
                break
            
            paso=True
            sys.stdout.write('M')
            sys.stdout.write(nombre)
            sys.stdout.write(',')
            sys.stdout.write(str(part))
            sys.stdout.write('N')
            sys.stdout.write(ubinascii.hexlify(result))
            sys.stdout.write('P')
            time.sleep_ms(31)
            break

def get_file2(nombre):
    with open(nombre, 'rb') as infile:
        while True:
            result = infile.read(512)
            if result == b'':
                break
            len = sys.stdout.write(ubinascii.hexlify(result))
            len2 = sys.stdout.write("@@@")
            while True:
                char = sys.stdin.read(1)
                #if char>0:
                if char == '\x0a': # espera para enviar mas datos
                    break