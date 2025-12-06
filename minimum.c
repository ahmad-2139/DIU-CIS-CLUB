#include <stdio.h>

int main(){
    int n,i,min;
    printf("Enter array size: ");
    scanf("%d", &n);
    int a[n];
    for(i=0;i<n;i++){
        printf("Enter element %d: ",i + 1);
        scanf("%d", &a[i]);
    }
    min = a[0];
    for(i=1;i<n;i++){
        if (a[i] < min){
            min = a[i];
        }
    }

    printf("The minimum number in the array is: %d\n", min);

    return 0;
}