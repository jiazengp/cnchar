import {IInputResult} from 'cnchar-types/plugin/input';
import {getCnChar} from '../cnchar';
import {getSpellDict} from '../util';
import {distinctArray, getAssociateWordsString, sortArrayWithWeights} from './common';

/*
split: (2) ['QTN', 'YYGT']
words: (2) ['勹', '广']

split: (2) ['QTNY', 'YGT']
words: (2) ['夕', 'YGT']

split: ['DIMTQTNYYGT']
words: ['DIMTQTNYYGT']

split: (2) ['QTNY', 'AS']
words: (2) ['夕', '苛苯茜菘菥葙蕈蘸']
*/

// cnchar.input('ni1menanhuisheng', {type: 'spell'})
// cnchar.input('nim', {type: 'spell'})
export function associateSpell (associate: boolean, result: IInputResult) {
    if (!associate || result.length === 0) return result;

    const cnchar = getCnChar();
    if (!cnchar) {
        console.warn('associateSpell: cnchar is not installed');
        return result;
    }

    const weights: number[] = []; // 结果权重

    const associateStr = getAssociateWordsString();

    result.forEach((item) => {
        let weight = 0;
        const {words} = item;

        for (let i = 0; i < words.length - 1; i++) {
            const word = getWordWithPartialSpell(words[i]);
            const nextWord = getWordWithPartialSpell(words[i + 1]);

            if (cnchar.isCnChar(word) && cnchar.isCnChar(nextWord)) {
                let thirdWord = getWordWithPartialSpell(words[i + 2]);
                if (!cnchar.isCnChar(thirdWord)) thirdWord = '';

                const regStr = ` [${word}][${nextWord}]` + (thirdWord ? `[${thirdWord}]` : '');
                const associateResult = associateStr.match(new RegExp(regStr, 'g'));
                if (associateResult) {
                    const distinct = distinctArray(associateResult);
                    weight += distinct.length;
                    item.association[i] = distinct.join('').substring(1);
                    item.association[++i] = '-';
                    if (thirdWord) {
                        item.association[++i] = '-';
                        weight += 2;
                    }
                } else {
                    item.association[i] = '';
                }
            } else {
                item.association[i] = item.association[i + 1] = '';
            }

        }
        weights.push(weight);
    });

    return sortArrayWithWeights(result, weights);
}


function getWordWithPartialSpell (word: string) {
    if (!word) return '';
    if (getCnChar()?.isCnChar(word)) return word;
    return buildAssWordsWithPartialSpell(word);
};

// 根据部分拼音生成联想字
function buildAssWordsWithPartialSpell (pSpell: string) {
    if (pSpell.length >= 6) return '';
    const dict = getSpellDict();
    let words = '';
    for (const key in dict) {
        if (key.indexOf(pSpell) === 0) {
            words += dict[key].match(/[\u4e00-\u9fa5]/g).join('');
        }
    }
    return words;
}