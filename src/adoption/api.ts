import { formAction } from '@solidjs/router';
import { runServer } from '../server/runtime';
import { AdoptionDesk } from './layer';

export const adoptMonster = formAction(async (data: URLSearchParams) => {
    'use server';
    const formData = new FormData();
    data.forEach((value, key) => {
        formData.append(key, value)
    })
    return runServer(AdoptionDesk.use((adoptionDesk) => adoptionDesk.apply(formData)))
})