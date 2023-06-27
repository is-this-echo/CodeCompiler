const Stubs = {};

Stubs.cpp = `
#include<iostream>
using namespace std;

int main(){

    cout << "Hello from C++";

    return 0;
}
`;

Stubs.py = `
import time

for i in range(1,3):
    print(i)
    time.sleep(i)
`;

export default Stubs;
