import { main } from './1';

main()
    .then(result => {
        console.log('结果:', result);
    })
    .catch(error => {
        console.error('错误:', error);
    });
